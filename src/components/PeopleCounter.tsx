import React, { useState, useEffect } from "react";
import { useSerial } from "../hooks/useSerial";
import LineChart from "./LineChart";
import "../App.css";

const fmt = (d: Date) =>
  d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

const PeopleCounter: React.FC = () => {
  const { state, connect, disconnect, reset } = useSerial();
  const [maxCap, setMaxCap] = useState(50);
  const [clock, setClock] = useState("");
  const [sessionDur, setSessionDur] = useState("—");
  const [peakCount, setPeakCount] = useState(0);

  const pct = Math.min(100, Math.round((state.count / maxCap) * 100));
  const isWarn = pct >= 80 && pct < 100;
  const isCrit = pct >= 100;
  const isDetected = state.irStatus.toLowerCase().includes("detect");

  // Track peak
  useEffect(() => {
    if (state.count > peakCount) setPeakCount(state.count);
  }, [state.count]);

  // Clock tick
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Session duration
  useEffect(() => {
    if (!state.sessionStart) {
      setSessionDur("—");
      return;
    }
    const id = setInterval(() => {
      const sec = Math.floor(
        (Date.now() - state.sessionStart!.getTime()) / 1000,
      );
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      if (h > 0) setSessionDur(`${h}h ${m}m`);
      else if (m > 0) setSessionDur(`${m}m ${s}s`);
      else setSessionDur(`${s}s`);
    }, 1000);
    return () => clearInterval(id);
  }, [state.sessionStart]);

  const connectionLabel = state.isConnected ? "Live" : "Offline";

  return (
    <div className="app">
      {/* Topbar */}
      <nav className="topbar">
        <div className="topbar-brand">
          <div className={`topbar-dot ${state.isConnected ? "live" : ""}`} />
          OccuTrack Lab
        </div>
        <div className="topbar-sep" />
        <div className="topbar-meta">{clock}</div>
        <div className="topbar-right">
          <div className={`chip ${state.isConnected ? "green" : ""}`}>
            {connectionLabel}
          </div>
          {isCrit && <div className="chip red">OVER CAPACITY</div>}
          {isWarn && !isCrit && <div className="chip amber">Near Limit</div>}
        </div>
      </nav>

      {/* Alert strips */}
      {isCrit && (
        <div className="alert-strip critical">
          <span>⚠</span>
          Room has exceeded max capacity of {maxCap}. Current occupancy:{" "}
          {state.count}.
        </div>
      )}
      {isWarn && !isCrit && (
        <div className="alert-strip warning">
          <span>ℹ</span>
          Approaching capacity — {pct}% occupied ({state.count}/{maxCap}).
        </div>
      )}

      <main className="main">
        {/* Numbers row */}
        <div className="numbers-row">
          {/* Big occupancy */}
          <div
            className={`num-card primary${isCrit ? " crit" : isWarn ? " warn" : ""}`}
          >
            <div className="num-label">Current Occupancy</div>
            <div className="num-value">{state.count}</div>
            <div className="num-sub">
              {state.lastDirection ? (
                <>
                  <span
                    className={`dir-tag ${state.lastDirection.toLowerCase()}`}
                  >
                    {state.lastDirection}
                  </span>
                  last event
                </>
              ) : (
                "No events yet"
              )}
            </div>
          </div>

          <div className="num-card">
            <div className="num-label">Total Entries</div>
            <div className="num-value" style={{ fontSize: 32 }}>
              {state.totalIn}
            </div>
            <div className="num-sub">
              <span className="dir-tag in">IN</span> this session
            </div>
          </div>

          <div className="num-card">
            <div className="num-label">Total Exits</div>
            <div className="num-value" style={{ fontSize: 32 }}>
              {state.totalOut}
            </div>
            <div className="num-sub">
              <span className="dir-tag out">OUT</span> this session
            </div>
          </div>

          <div className="num-card">
            <div className="num-label">Peak Occupancy</div>
            <div className="num-value" style={{ fontSize: 32 }}>
              {peakCount}
            </div>
            <div className="num-sub">highest recorded</div>
          </div>
        </div>

        {/* Middle row: chart + side panel */}
        <div className="mid-row">
          {/* Chart card */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Occupancy Over Time</div>
              <div className="card-badge">{state.log.length} events</div>
            </div>
            <LineChart log={state.log} />
          </div>

          {/* Right side: capacity + IR */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Capacity */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Capacity</div>
                <div className="card-badge">{pct}%</div>
              </div>
              <div className="capacity-block">
                <div className="cap-row">
                  <div className="cap-fraction">
                    {state.count}
                    <span style={{ color: "var(--text-3)", fontWeight: 400 }}>
                      /{maxCap}
                    </span>
                  </div>
                  <div
                    className="cap-pct"
                    style={{
                      color: isCrit
                        ? "var(--red)"
                        : isWarn
                          ? "var(--amber)"
                          : "var(--text-2)",
                    }}
                  >
                    {pct}%
                  </div>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill${isCrit ? " crit" : isWarn ? " warn" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="cap-input-row">
                  <span className="cap-input-label">Max capacity</span>
                  <input
                    className="input-sm"
                    type="number"
                    min={1}
                    max={9999}
                    value={maxCap}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v > 0) setMaxCap(v);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* IR Sensor */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">IR Sensor</div>
                <div className="card-badge">
                  {state.isConnected ? "active" : "offline"}
                </div>
              </div>
              <div className="ir-block">
                <div className="ir-row">
                  <div className={`ir-led ${isDetected ? "active" : ""}`} />
                  <div className="ir-label">
                    {isDetected ? "Object detected" : "Path clear"}
                  </div>
                </div>
                <div className="ir-raw">
                  {state.irStatus || "Awaiting signal…"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: log + session + controls */}
        <div className="bottom-row">
          {/* Event log */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Event Log</div>
              <div className="card-badge">{state.log.length} recorded</div>
            </div>
            <div className="log-list">
              {state.log.length === 0 ? (
                <div className="log-empty">No events recorded yet.</div>
              ) : (
                state.log.map((entry) => (
                  <div key={entry.id} className="log-item">
                    <div className={`log-dir ${entry.direction.toLowerCase()}`}>
                      {entry.direction}
                    </div>
                    <div className="log-count">{entry.count}</div>
                    <div className="log-desc">
                      {entry.direction === "IN"
                        ? "Person entered"
                        : "Person exited"}
                    </div>
                    <div className="log-time">{fmt(entry.timestamp)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Session + Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Session summary */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Session Summary</div>
              </div>
              <div className="session-grid">
                {[
                  { label: "Duration", value: sessionDur },
                  { label: "Entries", value: state.totalIn },
                  { label: "Exits", value: state.totalOut },
                  { label: "Peak", value: peakCount },
                  { label: "Events", value: state.log.length },
                  { label: "Capacity", value: `${pct}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="session-cell">
                    <div className="session-cell-label">{label}</div>
                    <div className="session-cell-value">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Device</div>
              </div>
              <div className="controls-block">
                <div className="controls-status">
                  Status:{" "}
                  {state.isConnected
                    ? "Connected · 9600 baud"
                    : "Not connected"}
                </div>
                <div className="btn-row" style={{ padding: 0 }}>
                  {!state.isConnected ? (
                    <button
                      className="btn btn-blue"
                      onClick={connect}
                      style={{ flex: 1 }}
                    >
                      Connect Arduino
                    </button>
                  ) : (
                    <button
                      className="btn"
                      onClick={disconnect}
                      style={{ flex: 1 }}
                    >
                      Disconnect
                    </button>
                  )}
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      reset();
                      setPeakCount(0);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-left">Room Monitor · Arduino Serial · v1.0</div>
        <div className="footer-right">
          <span>
            Port: <b>{state.isConnected ? "9600 baud" : "—"}</b>
          </span>
          <span>
            Events: <b>{state.log.length}</b>
          </span>
          <span>
            Session: <b>{sessionDur}</b>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default PeopleCounter;
