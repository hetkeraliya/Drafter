"use client";

import { useEffect, useRef } from "react";

// Always white paper with dark ink, so a saved sketch reads the same in light and dark mode.
export function SketchPad({ onSave }: { onSave: (url: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  function paper() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  useEffect(paper, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const box = canvas.getBoundingClientRect();
    return { x: (e.clientX - box.left) * (canvas.width / box.width), y: (e.clientY - box.top) * (canvas.height / box.height) };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.strokeStyle = "#1c1c1e";
    ctx.fillStyle = "#1c1c1e";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.arc(x, y, 1.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    drawing.current = false;
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={900}
        height={600}
        className="aspect-[3/2] w-full rounded-xl bg-white"
        style={{ touchAction: "none" }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={paper} className="btn-plain !text-[var(--red)]">
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            const url = canvasRef.current?.toDataURL("image/png") || "";
            if (url) onSave(url);
          }}
          className="btn btn-sm"
        >
          Save Sketch
        </button>
      </div>
    </div>
  );
}
