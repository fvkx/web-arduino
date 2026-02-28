import { useState, useRef, useCallback } from "react";

export interface LogEntry {
  id: number;
  direction: "IN" | "OUT";
  count: number;
  timestamp: Date;
}

export interface SerialState {
  isConnected: boolean;
  count: number;
  totalIn: number;
  totalOut: number;
  lastDirection: "IN" | "OUT" | null;
  log: LogEntry[];
  irStatus: string;
  sessionStart: Date | null;
}

export const useSerial = () => {
  const [state, setState] = useState<SerialState>({
    isConnected: false,
    count: 0,
    totalIn: 0,
    totalOut: 0,
    lastDirection: null,
    log: [],
    irStatus: "",
    sessionStart: null,
  });

  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const keepReadingRef = useRef(false);
  const logIdRef = useRef(0);

  const connect = useCallback(async () => {
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      keepReadingRef.current = true;
      setState(prev => ({ ...prev, isConnected: true, sessionStart: new Date() }));

      const textDecoder = new TextDecoderStream();
      // types for TextDecoderStream.writable don't align with serial API, cast to suppress error
      port.readable!.pipeTo(textDecoder.writable as unknown as WritableStream<any>).catch(() => {});
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;
      let buffer = "";

      while (keepReadingRef.current) {
        try {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            buffer += value;
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            lines.forEach(raw => {
              const line = raw.trim();
              if (!line) return;
              if (line === "IN" || line === "OUT") {
                const dir = line as "IN" | "OUT";
                setState(prev => {
                  const newCount = dir === "IN" ? prev.count + 1 : Math.max(0, prev.count - 1);
                  const entry: LogEntry = {
                    id: ++logIdRef.current,
                    direction: dir,
                    count: newCount,
                    timestamp: new Date(),
                  };
                  return {
                    ...prev,
                    count: newCount,
                    totalIn: dir === "IN" ? prev.totalIn + 1 : prev.totalIn,
                    totalOut: dir === "OUT" ? prev.totalOut + 1 : prev.totalOut,
                    lastDirection: dir,
                    log: [entry, ...prev.log].slice(0, 200),
                  };
                });
              } else {
                setState(prev => ({ ...prev, irStatus: line }));
              }
            });
          }
        } catch { break; }
      }
    } catch (err) {
      console.error("Connection failed:", err);
    }
  }, []);

  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    try { await readerRef.current?.cancel(); } catch {}
    try { await portRef.current?.close(); } catch {}
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({ ...prev, count: 0, totalIn: 0, totalOut: 0, lastDirection: null, log: [], sessionStart: prev.isConnected ? new Date() : null }));
  }, []);

  return { state, connect, disconnect, reset };
};
