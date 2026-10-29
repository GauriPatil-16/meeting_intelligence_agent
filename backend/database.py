import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DATABASE_PATH = Path(__file__).parent / "data" / "meetings.db"


def _connect():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DATABASE_PATH)


def create_table():
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS meetings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transcript TEXT NOT NULL,
                analysis TEXT NOT NULL,
                created_at TEXT
            )
            """
        )
        columns = {row[1] for row in conn.execute("PRAGMA table_info(meetings)")}
        if "created_at" not in columns:
            conn.execute("ALTER TABLE meetings ADD COLUMN created_at TEXT")


def save_meeting(transcript, analysis):
    created_at = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        conn.execute(
            "INSERT INTO meetings (transcript, analysis, created_at) VALUES (?, ?, ?)",
            (transcript, analysis, created_at),
        )


def get_meetings():
    with _connect() as conn:
        rows = conn.execute(
            "SELECT id, transcript, analysis, created_at FROM meetings ORDER BY id DESC"
        ).fetchall()

    meetings = []
    for meeting_id, transcript, raw_analysis, created_at in rows:
        try:
            analysis = json.loads(raw_analysis)
        except (TypeError, json.JSONDecodeError):
            analysis = {}
        meetings.append({
            "id": meeting_id,
            "transcript": transcript,
            "analysis": analysis,
            "created_at": created_at,
        })
    return meetings


def update_action_item(meeting_id, action_index, updates):
    with _connect() as conn:
        row = conn.execute(
            "SELECT analysis FROM meetings WHERE id = ?", (meeting_id,)
        ).fetchone()
        if row is None:
            return None

        try:
            analysis = json.loads(row[0])
        except (TypeError, json.JSONDecodeError):
            return None

        action_items = analysis.get("action_items")
        if not isinstance(action_items, list) or not 0 <= action_index < len(action_items):
            return None

        action_items[action_index].update(updates)
        conn.execute(
            "UPDATE meetings SET analysis = ? WHERE id = ?",
            (json.dumps(analysis, ensure_ascii=False), meeting_id),
        )
        return action_items[action_index]
