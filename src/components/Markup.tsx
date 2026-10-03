"use client";

import { useEffect, useRef } from "react";
import { Sheet } from "./Sheet";

const INK = ["#ff3b30", "#ffcc00", "#34c759", "#007aff", "#ffffff", "#1c1c1e"];

export function Markup({ src, onSave, onClose }: { src: string; onSave: (url: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const color = useRef(INK[0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    };
    img.src = src;
  }, [src]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const box = canvas.getBoundingClientRect();
    return { x: (e.clientX - box.left) * (canvas.width / box.width), y: (e.clientY - box.top) * (canvas.height / box.height) };
  }

  const stop = () => {
    drawing.current = false;
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Markup"
      full
      leading={
        <button type="button" className="nav-btn" onClick={onClose}>
          Cancel
        </button>
      }
      action={
        <button
          type="button"
          className="nav-btn strong"
          onClick={() => onSave(canvasRef.current?.toDataURL("image/jpeg", 0.86) || src)}
        >
          Save
        </button>
      }
    >
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        className="aspect-[3/2] w-full rounded-xl bg-white"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          const ctx = canvasRef.current?.getContext("2d");
          if (!ctx) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          const { x, y } = point(e);
          ctx.strokeStyle = color.current;
          ctx.lineWidth = 6;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(x, y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvasRef.current?.getContext("2d");
          if (!ctx) return;
          const { x, y } = point(e);
          ctx.lineTo(x, y);
          ctx.stroke();
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
      />
      <div className="mt-4 flex justify-center gap-3">
        {INK.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Ink ${c}`}
            className="h-9 w-9 rounded-full border border-[var(--line)] press"
            style={{ background: c }}
            onClick={() => {
              color.current = c;
            }}
          />
        ))}
      </div>
    </Sheet>
  );
}
