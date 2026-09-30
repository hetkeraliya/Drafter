"use client";

import { useEffect, useRef, useState } from "react";
import { Waveform } from "./Waveform";

export function Recorder({
  value,
  onChange,
}: {
  value: { url: string; name: string } | null;
  onChange: (next: { url: string; name: string } | null) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream);
      recRef.current = rec;
      chunks.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(chunks.current, { type: mime });
        const reader = new FileReader();
        reader.onload = () => onChange({ url: String(reader.result || ""), name: `memo.${mime.includes("webm") ? "webm" : "m4a"}` });
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      setRecording(true);
    } catch {
      setError("Microphone permission is needed to record.");
    }
  }

  function stop() {
    recRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className={`card space-y-3 p-4 ${recording ? "rec-live" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm">{recording ? "Listening…" : value ? "Voice saved" : "Tap to record"}</p>
        <button type="button" onClick={recording ? stop : start} className="btn min-h-10 px-4 text-sm">
          {recording ? "Stop" : value ? "Record again" : "Record"}
        </button>
      </div>
      <div className={recording ? "text-[var(--accent)]" : "text-[var(--ink)] opacity-40"}>
        <Waveform live={recording} />
      </div>
      {value?.url && <audio controls src={value.url} className="w-full" />}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
