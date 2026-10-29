
import json
import logging
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf import PdfReader
from groq import APIConnectionError
from .agent import analyze_meeting
from .database import create_table, save_meeting, get_meetings, update_action_item

app = FastAPI(title="Meeting Intelligence Agent")

# used to allow React to send requests to FastAPI.
# used to allow the React frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins during local development.
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

#used to Create the SQLite table when the backend starts.
create_table()


# Define the request format for pasted transcript text.
class MeetingRequest(BaseModel):
    transcript: str


class ActionItemUpdate(BaseModel):
    task: str = Field(min_length=1, max_length=1000)
    owner: str | None = Field(default=None, max_length=200)
    deadline: str | None = Field(default=None, max_length=200)
    priority: str | None = None
    status: str = "Open"


@app.get("/")
def home():
    # Check whether the backend is running.
    return {"message": "Meeting Intelligence Agent is running!"}


def process_transcript(transcript: str):
    # Prevent empty text from being sent to Groq.
    if not transcript.strip():
        raise HTTPException(
            status_code=400,
            detail="No readable meeting transcript found."
        )

    try:
        # Ask Groq to summarize and analyze the meeting.
        result = analyze_meeting(transcript)

        # Save the transcript and analysis in SQLite.
        save_meeting(transcript, json.dumps(result))

        return {"summary_and_analysis": result}

    except HTTPException:
        raise
    except APIConnectionError as error:
        logging.exception("Could not connect to the Groq API")
        raise HTTPException(
            status_code=503,
            detail=(
                "Meeting analysis is temporarily unavailable because the backend "
                "cannot reach Groq. Check internet or firewall access and try again."
            ),
        ) from error
    except Exception:
        # Return a clear error if AI analysis fails.
        logging.exception("Meeting analysis failed")
        raise HTTPException(
            status_code=500,
            detail="Meeting analysis failed. Check the backend terminal."
        )


# Existing endpoint: analyze text pasted into React.
@app.post("/analyze")
def analyze(data: MeetingRequest):
    return process_transcript(data.transcript)


# New endpoint: upload a PDF and analyze its extracted text.
@app.post("/analyze-pdf")
def analyze_pdf(file: UploadFile = File(...)):
    # Accept PDF files only.
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    try:
        # Read the uploaded PDF and extract text from its pages.
        reader = PdfReader(file.file)

        # Reject password-protected PDFs that cannot be opened.
        if reader.is_encrypted:
            raise HTTPException(
                status_code=400,
                detail="This PDF is password-protected."
            )

        transcript = "\n".join(
            page.extract_text() or "" for page in reader.pages
        )

        # Send the extracted text through the same analysis workflow.
        return process_transcript(transcript)

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not read this PDF. Please try another PDF."
        )
    finally:
        # Close the uploaded file after processing.
        file.file.close()


# Existing endpoint: retrieve saved meeting history.
@app.get("/meetings")
def view_meetings():
    return {"meetings": get_meetings()}


@app.patch("/meetings/{meeting_id}/actions/{action_index}")
def edit_action_item(meeting_id: int, action_index: int, data: ActionItemUpdate):
    if data.priority not in (None, "High", "Medium", "Low"):
        raise HTTPException(status_code=422, detail="Priority must be High, Medium, Low, or empty.")
    if data.status not in ("Open", "In Progress", "Done"):
        raise HTTPException(status_code=422, detail="Status must be Open, In Progress, or Done.")

    updates = data.dict()
    for field in ("task", "owner", "deadline"):
        value = updates[field]
        if isinstance(value, str):
            value = value.strip()
        updates[field] = value or None
    if not updates["task"]:
        raise HTTPException(status_code=422, detail="Action item task cannot be empty.")

    updated = update_action_item(meeting_id, action_index, updates)
    if updated is None:
        raise HTTPException(status_code=404, detail="Meeting or action item was not found.")
    return {"action_item": updated}
