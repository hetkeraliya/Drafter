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
      setError("Allow microphone access in Settings to record.");
    }
  }

  function stop() {
    recRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="group px-5 py-6 text-center">
      <div className={`flex justify-center ${recording ? "text-[var(--red)]" : "text-[var(--faint)]"}`}>
        <Waveform live={recording} bars={26} />
      </div>
      <p className="mt-3 text-[15px] text-[var(--muted)]">{recording ? "Recording…" : value ? "Voice memo saved" : "Tap to record"}</p>
      <button
        type="button"
        onClick={recording ? stop : start}
        aria-label={recording ? "Stop recording" : value ? "Record again" : "Start recording"}
        className={`press mx-auto mt-4 grid h-[68px] w-[68px] place-items-center rounded-full border-[3px] border-[var(--faint)] ${recording ? "rec-live" : ""}`}
      >
        <span
          className="block bg-[var(--red)] transition-all duration-300"
          style={{ width: recording ? 24 : 54, height: recording ? 24 : 54, borderRadius: recording ? 7 : 27 }}
        />
      </button>
      {value?.url && <audio controls src={value.url} className="mt-5 w-full" />}
      {error && <p className="mt-3 text-[15px] text-[var(--red)]">{error}</p>}
    </div>
  );
}
