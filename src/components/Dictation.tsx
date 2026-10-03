"use client";

import { useEffect, useRef, useState } from "react";
import { speechSupported, startDictation } from "@/lib/speech";
import { MicIcon } from "./Icons";

export function Dictation({
  onFinal,
  label = "Dictate",
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
    <div>
      <button type="button" onClick={toggle} className={`btn btn-sm ${on ? "rec-live !bg-[var(--red)] !text-white" : "btn-quiet"}`}>
        <MicIcon size={16} /> {on ? "Stop" : label}
      </button>
      {live && <p className="mt-2 text-[15px] text-[var(--muted)]">{live}</p>}
    </div>
  );
}
