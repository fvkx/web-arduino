// import React, { useState, useEffect, useMemo, useRef } from "react";
// import { useSerial } from "../hooks/useSerial";
// import LineChart from "./LineChart";
// import "../App.css";

// interface LogEntry {
//   id: number;
//   direction: "IN" | "OUT";
//   count: number;
//   timestamp: Date;
// }

// const fmt = (d: Date) =>
//   d.toLocaleTimeString("en-US", {
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: false,
//   });

// const DASH = "\u2014";

// const PeopleCounter: React.FC = () => {
//   const { count, log, connect, disconnect, connected } = useSerial();

//   const [maxCap, setMaxCap] = useState(50);
//   const [clock, setClock] = useState("");
//   const [sessionDur, setSessionDur] = useState(DASH);

//   // Refs avoid the react-hooks/set-state-in-effect lint error.
//   // Peak and sessionStart are derived from props/state on each render,
//   // so they don't need to be state — refs persist them without re-rendering.
//   const peakRef = useRef(0);
//   const sessionStartRef = useRef<Date | null>(null);

//   // Derive peak inline during render (no effect needed)
//   peakRef.current = Math.max(peakRef.current, count);
//   const peakCount = peakRef.current;

//   // Derive session start inline during render (no effect needed)
//   if (connected && sessionStartRef.current === null) {
//     sessionStartRef.current = new Date();
//   } else if (!connected && sessionStartRef.current !== null) {
//     sessionStartRef.current = null;
//   }

//   // Reconstruct structured log entries from raw string[]
//   const parsedLog = useMemo<LogEntry[]>(() => {
//     const ordered = [...log].reverse(); // log is newest-first; replay oldest-first
//     const entries = ordered.reduce<LogEntry[]>((acc, dir, i) => {
//       const direction = dir.trim().toUpperCase() === "IN" ? "IN" : "OUT";
//       const prev = acc.length > 0 ? acc[acc.length - 1].count : 0;
//       const next = direction === "IN" ? prev + 1 : Math.max(0, prev - 1);
//       return [...acc, { id: i, direction, count: next, timestamp: new Date() }];
//     }, []);
//     return entries.reverse(); // display newest-first
//   }, [log]);

//   const totalIn = useMemo(
//     () => log.filter((d) => d.trim().toUpperCase() === "IN").length,
//     [log],
//   );
//   const totalOut = useMemo(
//     () => log.filter((d) => d.trim().toUpperCase() === "OUT").length,
//     [log],
//   );

//   const lastDirection =
//     log.length > 0 ? (log[0].trim().toUpperCase() as "IN" | "OUT") : null;

//   const pct = Math.min(100, Math.round((count / maxCap) * 100));
//   const isWarn = pct >= 80 && pct < 100;
//   const isCrit = pct >= 100;

//   // Local reset
//   const handleReset = () => {
//     peakRef.current = 0;
//     sessionStartRef.current = connected ? new Date() : null;
//     setSessionDur(DASH);
//   };

//   // Clock tick — legitimate external sync, effect is correct here
//   useEffect(() => {
//     const tick = () =>
//       setClock(new Date().toLocaleTimeString("en-US", { hour12: false }));
//     tick();
//     const id = setInterval(tick, 1000);
//     return () => clearInterval(id);
//   }, []);

//   // Session duration — setState is called inside the interval callback,
//   // NOT synchronously in the effect body, so this is fine
//   useEffect(() => {
//     const start = sessionStartRef.current;
//     if (!start) {
//       setSessionDur(DASH);
//       return;
//     }
//     const id = setInterval(() => {
//       const sec = Math.floor((Date.now() - start.getTime()) / 1000);
//       const h = Math.floor(sec / 3600);
//       const m = Math.floor((sec % 3600) / 60);
//       const s = sec % 60;
//       if (h > 0) setSessionDur(`${h}h ${m}m`);
//       else if (m > 0) setSessionDur(`${m}m ${s}s`);
//       else setSessionDur(`${s}s`);
//     }, 1000);
//     return () => clearInterval(id);
//   }, [connected]); // re-run on connect/disconnect so the ref snapshot is fresh

//   const connectionLabel = connected ? "Live" : "Offline";

//   return (
//     <div className="app">
//       {/* Topbar */}
//       <nav className="topbar">
//         <div className="topbar-brand">
//           <div className={`topbar-dot ${connected ? "live" : ""}`} />
//           OccuTrack Lab
//         </div>
//         <div className="topbar-sep" />
//         <div className="topbar-meta">{clock}</div>
//         <div className="topbar-right">
//           <div className={`chip ${connected ? "green" : ""}`}>
//             {connectionLabel}
//           </div>
//           {isCrit && <div className="chip red">OVER CAPACITY</div>}
//           {isWarn && !isCrit && <div className="chip amber">Near Limit</div>}
//         </div>
//       </nav>

//       {/* Alert strips */}
//       {isCrit && (
//         <div className="alert-strip critical">
//           <span>&#9888;</span>
//           Room has exceeded max capacity of {maxCap}. Current occupancy:{" "}
//           {count}.
//         </div>
//       )}
//       {isWarn && !isCrit && (
//         <div className="alert-strip warning">
//           <span>&#x2139;</span>
//           Approaching capacity &mdash; {pct}% occupied ({count}/{maxCap}).
//         </div>
//       )}

//       <main className="main">
//         {/* Numbers row */}
//         <div className="numbers-row">
//           <div
//             className={`num-card primary${isCrit ? " crit" : isWarn ? " warn" : ""}`}
//           >
//             <div className="num-label">Current Occupancy</div>
//             <div className="num-value">{count}</div>
//             <div className="num-sub">
//               {lastDirection ? (
//                 <>
//                   <span className={`dir-tag ${lastDirection.toLowerCase()}`}>
//                     {lastDirection}
//                   </span>{" "}
//                   last event
//                 </>
//               ) : (
//                 "No events yet"
//               )}
//             </div>
//           </div>

//           <div className="num-card">
//             <div className="num-label">Total Entries</div>
//             <div className="num-value" style={{ fontSize: 32 }}>
//               {totalIn}
//             </div>
//             <div className="num-sub">
//               <span className="dir-tag in">IN</span> this session
//             </div>
//           </div>

//           <div className="num-card">
//             <div className="num-label">Total Exits</div>
//             <div className="num-value" style={{ fontSize: 32 }}>
//               {totalOut}
//             </div>
//             <div className="num-sub">
//               <span className="dir-tag out">OUT</span> this session
//             </div>
//           </div>

//           <div className="num-card">
//             <div className="num-label">Peak Occupancy</div>
//             <div className="num-value" style={{ fontSize: 32 }}>
//               {peakCount}
//             </div>
//             <div className="num-sub">highest recorded</div>
//           </div>
//         </div>

//         {/* Middle row */}
//         <div className="mid-row">
//           <div className="card">
//             <div className="card-head">
//               <div className="card-title">Occupancy Over Time</div>
//               <div className="card-badge">{parsedLog.length} events</div>
//             </div>
//             <LineChart log={parsedLog} />
//           </div>

//           <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//             {/* Capacity */}
//             <div className="card">
//               <div className="card-head">
//                 <div className="card-title">Capacity</div>
//                 <div className="card-badge">{pct}%</div>
//               </div>
//               <div className="capacity-block">
//                 <div className="cap-row">
//                   <div className="cap-fraction">
//                     {count}
//                     <span style={{ color: "var(--text-3)", fontWeight: 400 }}>
//                       /{maxCap}
//                     </span>
//                   </div>
//                   <div
//                     className="cap-pct"
//                     style={{
//                       color: isCrit
//                         ? "var(--red)"
//                         : isWarn
//                           ? "var(--amber)"
//                           : "var(--text-2)",
//                     }}
//                   >
//                     {pct}%
//                   </div>
//                 </div>
//                 <div className="progress-track">
//                   <div
//                     className={`progress-fill${isCrit ? " crit" : isWarn ? " warn" : ""}`}
//                     style={{ width: `${pct}%` }}
//                   />
//                 </div>
//                 <div className="cap-input-row">
//                   <span className="cap-input-label">Max capacity</span>
//                   <input
//                     className="input-sm"
//                     type="number"
//                     min={1}
//                     max={9999}
//                     value={maxCap}
//                     onChange={(e) => {
//                       const v = parseInt(e.target.value);
//                       if (!isNaN(v) && v > 0) setMaxCap(v);
//                     }}
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* IR Sensor */}
//             <div className="card">
//               <div className="card-head">
//                 <div className="card-title">IR Sensor</div>
//                 <div className="card-badge">
//                   {connected ? "active" : "offline"}
//                 </div>
//               </div>
//               <div className="ir-block">
//                 <div className="ir-row">
//                   <div className={`ir-led ${connected ? "active" : ""}`} />
//                   <div className="ir-label">
//                     {connected ? "Monitoring" : "Offline"}
//                   </div>
//                 </div>
//                 <div className="ir-raw">
//                   {connected ? "Signal active" : "Awaiting signal\u2026"}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Bottom row */}
//         <div className="bottom-row">
//           <div className="card">
//             <div className="card-head">
//               <div className="card-title">Event Log</div>
//               <div className="card-badge">{parsedLog.length} recorded</div>
//             </div>
//             <div className="log-list">
//               {parsedLog.length === 0 ? (
//                 <div className="log-empty">No events recorded yet.</div>
//               ) : (
//                 parsedLog.map((entry: LogEntry) => (
//                   <div key={entry.id} className="log-item">
//                     <div className={`log-dir ${entry.direction.toLowerCase()}`}>
//                       {entry.direction}
//                     </div>
//                     <div className="log-count">{entry.count}</div>
//                     <div className="log-desc">
//                       {entry.direction === "IN"
//                         ? "Person entered"
//                         : "Person exited"}
//                     </div>
//                     <div className="log-time">{fmt(entry.timestamp)}</div>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>

//           <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//             <div className="card">
//               <div className="card-head">
//                 <div className="card-title">Session Summary</div>
//               </div>
//               <div className="session-grid">
//                 {[
//                   { label: "Duration", value: sessionDur },
//                   { label: "Entries", value: totalIn },
//                   { label: "Exits", value: totalOut },
//                   { label: "Peak", value: peakCount },
//                   { label: "Events", value: parsedLog.length },
//                   { label: "Capacity", value: `${pct}%` },
//                 ].map(({ label, value }) => (
//                   <div key={label} className="session-cell">
//                     <div className="session-cell-label">{label}</div>
//                     <div className="session-cell-value">{value}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="card">
//               <div className="card-head">
//                 <div className="card-title">Device</div>
//               </div>
//               <div className="controls-block">
//                 <div className="controls-status">
//                   Status:{" "}
//                   {connected
//                     ? "Connected \u00b7 9600 baud"
//                     : "Not connected"}
//                 </div>
//                 <div className="btn-row" style={{ padding: 0 }}>
//                   {!connected ? (
//                     <button
//                       className="btn btn-blue"
//                       onClick={connect}
//                       style={{ flex: 1 }}
//                     >
//                       Connect Arduino
//                     </button>
//                   ) : (
//                     <button
//                       className="btn"
//                       onClick={disconnect}
//                       style={{ flex: 1 }}
//                     >
//                       Disconnect
//                     </button>
//                   )}
//                   <button className="btn btn-ghost" onClick={handleReset}>
//                     Reset
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>

//       <footer className="footer">
//         <div className="footer-left">
//           Room Monitor \u00b7 Arduino Serial \u00b7 v1.0
//         </div>
//         <div className="footer-right">
//           <span>
//             Port: <b>{connected ? "9600 baud" : DASH}</b>
//           </span>
//           <span>
//             Events: <b>{parsedLog.length}</b>
//           </span>
//           <span>
//             Session: <b>{sessionDur}</b>
//           </span>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default PeopleCounter;