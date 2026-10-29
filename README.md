# Meeting Intelligence Agent

Analyze meeting transcripts and turn them into concise summaries, decisions, and actionable follow-ups. The application combines a React and Vite frontend with a FastAPI backend, Groq-powered analysis, and local SQLite meeting history.

## Demonstration

Watch the [product demonstration](./demostration.mp4).

<video controls width="100%" src="./demostration.mp4">
  Your Markdown viewer does not support embedded video. [Open the demonstration video](./demostration.mp4).
</video>

## Features

- Analyze pasted meeting transcripts or uploaded PDF files.
- Extract meeting summaries, key topics, decisions, risks, open questions, and next steps.
- Identify action items with owners, deadlines, priorities, and status when stated in the transcript.
- Review saved meetings, edit action items, and explore meeting insights.
- Export meeting reports.

## Tech stack

- **Frontend:** React, Vite, React Router, Recharts
- **Backend:** FastAPI, Uvicorn, Pydantic
- **Analysis:** Groq API through LangChain
- **Storage:** SQLite

## Requirements

- Python
- Node.js and npm
- A Groq API key

## Setup

Run these commands from the project root in PowerShell:

```powershell
py -m venv backend\.venv
.\backend\.venv\Scripts\python.exe -m pip install --upgrade pip
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Create `backend/.env` and add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key
```

Install the frontend dependencies:

```powershell
cd frontend
npm.cmd install
cd ..
```

Keep the API key private. The local `.env` file and SQLite database are excluded from version control.

## Run locally

Open two PowerShell terminals in the project root.

**Terminal 1 - Backend API**

```powershell
.\backend\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --reload-dir .\backend --host 127.0.0.1 --port 8765
```

**Terminal 2 - Frontend**

```powershell
cd frontend
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Open the app at [http://127.0.0.1:5173](http://127.0.0.1:5173). The Vite development server forwards `/api` requests to the backend on port `8765`.

To stop either server, press **Ctrl+C** in its terminal.

## API reference

Interactive API documentation is available at [http://127.0.0.1:8765/docs](http://127.0.0.1:8765/docs) while the backend is running.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | Check backend health |
| `POST` | `/analyze` | Analyze transcript text |
| `POST` | `/analyze-pdf` | Upload and analyze a PDF transcript |
| `GET` | `/meetings` | List saved meetings |
| `PATCH` | `/meetings/{meeting_id}/actions/{action_index}` | Update a saved action item |

## Project structure

```text
backend/
  agent.py             Groq-backed transcript analysis
  database.py          SQLite persistence
  main.py              FastAPI application and API routes
  requirements.txt     Python dependencies
  data/                Local database, created at runtime
frontend/
  src/                 React application
  package.json         Frontend dependencies and scripts
  vite.config.js       Vite configuration and API proxy
demostration.mp4       Product demonstration video
```
