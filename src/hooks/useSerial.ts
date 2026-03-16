import { useState, useRef } from "react";

export interface LogEntry {
  id: number;
  direction: "IN" | "OUT";
  count: number;
  timestamp: Date;
}

export const useSerial = () => {
  const [count, setCount]       = useState(0);
  const [log, setLog]           = useState<LogEntry[]>([]);
  const [connected, setConnected] = useState(false);

  const portRef      = useRef<SerialPort | null>(null);
  const readerRef    = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const bufferRef    = useRef("");          // incomplete line buffer
  const idRef        = useRef(0);           // auto-increment log entry id
  const countRef     = useRef(0);           // mirror of count state for use inside closure

  const connect = async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });

      portRef.current = port;
      setConnected(true);

      const decoder = new TextDecoderStream();
      port.readable!.pipeTo(decoder.writable);

      const reader = decoder.readable.getReader();
      readerRef.current = reader;
      bufferRef.current = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        // Accumulate chunks into buffer, process only complete lines
        bufferRef.current += value;
        const lines = bufferRef.current.split("\n");
        bufferRef.current = lines.pop() ?? ""; // keep incomplete tail

        for (const line of lines) {
          const msg = line.trim().toUpperCase();

          // Accept both plain "IN"/"OUT" (your Arduino) and "DIR:IN"/"DIR:OUT"
          let dir: "IN" | "OUT" | null = null;
          if (msg === "IN" || msg === "DIR:IN")   dir = "IN";
          if (msg === "OUT" || msg === "DIR:OUT") dir = "OUT";
          if (!dir) continue; // ignore COUNT:x, STATUS:READY, empty lines

          // Update running count
          if (dir === "IN") {
            countRef.current = countRef.current + 1;
          } else {
            countRef.current = Math.max(0, countRef.current - 1);
          }

          const entry: LogEntry = {
            id:        idRef.current++,
            direction: dir,
            count:     countRef.current,
            timestamp: new Date(),
          };

          setLog(prev => [entry, ...prev]);
          setCount(countRef.current);
        }
      }
    } catch (err: unknown) {
      // User cancelled port picker — not a real error
      if (err instanceof Error && err.name !== "NotFoundError") {
        console.error("Serial error:", err);
      }
      setConnected(false);
    }
  };

  const disconnect = async () => {
    try {
      await readerRef.current?.cancel();
      await portRef.current?.close();
    } catch {
      // port may already be closed
    } finally {
      portRef.current  = null;
      readerRef.current = null;
      countRef.current  = 0;
      setConnected(false);
    }
  };

  const reset = () => {
    countRef.current = 0;
    idRef.current    = 0;
    setCount(0);
    setLog([]);
  };

  // Expose both LogEntry[] log (for LineChart) and a plain string[] rawLog
  // (for Dashboard entry/exit counting) so both components work without changes
  const rawLog = log.map(e => e.direction); // string[] "IN"/"OUT"

  return { count, log, rawLog, connect, disconnect, connected, reset };
};