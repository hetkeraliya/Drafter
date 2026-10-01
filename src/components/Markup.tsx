"use client";

import { useEffect, useRef } from "react";

export function Markup({ src, onSave, onClose }: { src: string; onSave: (url: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

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

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[var(--ink)]/40 p-4">
      <div className="card w-full max-w-lg p-4">
        <p className="text-sm font-medium">Mark photo</p>
        <canvas
          ref={canvasRef}
          width={720}
          height={480}
          className="mt-3 w-full rounded-[12px] bg-[var(--soft)]"
          onPointerDown={(e) => {
            drawing.current = true;
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx) return;
            const { x, y } = point(e);
            ctx.strokeStyle = "#0f766e";
            ctx.lineWidth = 4;
            ctx.lineCap = "round";
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
          onPointerUp={() => {
            drawing.current = false;
          }}
        />
        <div className="mt-3 flex gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              const url = canvasRef.current?.toDataURL("image/jpeg", 0.86) || src;
              onSave(url);
            }}
          >
            Save marks
          </button>
        </div>
      </div>
    </div>
  );
}
