// import { useState, useRef, useCallback } from "react";

// export interface LogEntry {
//   id: number;
//   direction: "IN" | "OUT";
//   count: number;
//   timestamp: Date;
// }

// export const useSerial = () => {
//   const [count, setCount] = useState(0);
//   const [log, setLog] = useState<string[]>([]);
//   const [connected, setConnected] = useState(false);

//   const portRef = useRef<SerialPort | null>(null);
//   const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
//   const isReadingRef = useRef(false);

//   const connect = useCallback(async () => {
//     try {
//       const port = await navigator.serial.requestPort();
//       await port.open({ baudRate: 9600 });

//       portRef.current = port;
//       setConnected(true);
//       isReadingRef.current = true;

//       console.log("✅ Serial connected. Non-blocking read started.");

//       const decoder = new TextDecoderStream();
//       port.readable!.pipeTo(decoder.writable);

//       const reader = decoder.readable.getReader();
//       readerRef.current = reader;

//       const readChunk = async () => {
//         if (!isReadingRef.current || !readerRef.current) return;

//         try {
//           const { value, done } = await readerRef.current.read();
//           if (done) {
//             console.log("Reader done.");
//             return;
//           }

//           if (value.trim()) {
//             console.log("Raw:", JSON.stringify(value.slice(-50)));
//             const lines = value.split("\n").filter(l => l.trim());
//             for (const line of lines) {
//               const msg = line.trim();
//               if (msg.startsWith("DIR:")) {
//                 const dir = msg.split(":")[1]?.trim();
//                 if (dir === "IN" || dir === "OUT") {
//                   console.log("DIR:", dir);
//                   setLog(p => [dir, ...p.slice(0, 99)]);
//                   setCount(c => dir === "IN" ? c + 1 : Math.max(0, c - 1));
//                 }
//               }
//             }
//           }
//           setTimeout(readChunk, 10); // Yield + small delay
//         } catch (err) {
//           console.error("Read err:", err);
//           if (isReadingRef.current) setTimeout(readChunk, 100);
//         }
//       };
//       readChunk();
//     } catch (err) {
//       console.error("Connect err:", err);
//       setConnected(false);
//     }
//   }, []);

//   const disconnect = useCallback(async () => {
//     isReadingRef.current = false;
//     try {
//       readerRef.current?.cancel();
//       portRef.current?.close();
//     } catch {
//       /* Empty intentionally - port may be closed already */
//     }
//     setConnected(false);
//     console.log("Disconnected.");
//   }, []);

//   return { count, log, connect, disconnect, connected };
// };
