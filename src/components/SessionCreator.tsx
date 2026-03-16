import { useState } from "react";

export interface SessionData {
  id:    number;
  room:  string;
  year:  string;
  start: string;
  end:   string;
}

interface Props {
  onAdd: (data: Omit<SessionData, "id">) => void;
}

export default function SessionCreator({ onAdd }: Props) {
  const [room,  setRoom]  = useState("");
  const [year,  setYear]  = useState("");
  const [start, setStart] = useState("");
  const [end,   setEnd]   = useState("");
  const [err,   setErr]   = useState<string | null>(null);

  const handleAdd = () => {
    if (!room.trim())  { setErr("Room name is required.");             return; }
    if (!year.trim())  { setErr("Year level is required.");            return; }
    if (!start)        { setErr("Start time is required.");            return; }
    if (!end)          { setErr("End time is required.");              return; }
    if (end <= start)  { setErr("End time must be after start time."); return; }
    setErr(null);
    onAdd({ room: room.trim(), year: year.trim(), start, end });
    setRoom(""); setYear(""); setStart(""); setEnd("");
  };

  return (
    <div className="dash-form">
      <div className="dash-field">
        <label className="dash-label">Room</label>
        <input
          className="dash-input"
          placeholder="e.g. Room 101"
          value={room}
          onChange={e => setRoom(e.target.value)}
        />
      </div>

      <div className="dash-field">
        <label className="dash-label">Year Level</label>
        <input
          className="dash-input"
          placeholder="e.g. Grade 11"
          value={year}
          onChange={e => setYear(e.target.value)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="dash-field">
          <label className="dash-label">Start Time</label>
          <input
            className="dash-input"
            type="time"
            value={start}
            onChange={e => setStart(e.target.value)}
          />
        </div>
        <div className="dash-field">
          <label className="dash-label">End Time</label>
          <input
            className="dash-input"
            type="time"
            value={end}
            onChange={e => setEnd(e.target.value)}
          />
        </div>
      </div>

      {err && <div className="dash-error">{err}</div>}

      <button
        className="dash-btn blue"
        onClick={handleAdd}
        style={{ width: "100%" }}
      >
        + Add to Queue
      </button>
    </div>
  );
}