"use client";

import { useEffect, useRef, useState } from "react";
import { speechSupported, startDictation } from "@/lib/speech";

export function Dictation({
  onFinal,
  label = "Speak to write",
}: {
  onFinal: (text: string) => void;
  label?: string;
}) {
  const [live, setLive] = useState("");
  const [on, setOn] = useState(false);
  const rec = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    return () => rec.current?.stop();
  }, []);

  if (!speechSupported()) return null;

  function toggle() {
    if (on) {
      rec.current?.stop();
      rec.current = null;
      setOn(false);
      setLive("");
      return;
    }
    rec.current = startDictation((text, final) => {
      setLive(text);
      if (final && text) onFinal(text);
    });
    setOn(Boolean(rec.current));
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={toggle} className={`btn-ghost -ml-3 ${on ? "text-[var(--accent)]" : ""}`}>
        {on ? "Stop listening" : label}
      </button>
      {live && <p className="text-sm text-[var(--muted)]">{live}</p>}
    </div>
  );
}
