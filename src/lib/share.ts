export async function shareText(title: string, text: string) {
  const payload = `${title}\n\n${text}`.trim();
  if (navigator.share) {
    try {
      await navigator.share({ title, text: payload });
      return "shared";
    } catch {
      /* user cancelled */
    }
  }
  try {
    await navigator.clipboard.writeText(payload);
    return "copied";
  } catch {
    return "failed";
  }
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function noteToText(note: { title: string; body: string; items: { label: string; checked: boolean }[] }) {
  const lines = note.items.map((item) => `${item.checked ? "[x]" : "[ ]"} ${item.label}`);
  return [note.title, note.body, ...lines].filter(Boolean).join("\n");
}

export function exportQuoteCard(headline: string, body: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#F4F5F7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0b0d12";
  ctx.font = "600 64px Outfit, sans-serif";
  wrap(ctx, headline, 96, 280, 888, 76);
  ctx.fillStyle = "#6b7280";
  ctx.font = "400 32px Outfit, sans-serif";
  wrap(ctx, body, 96, 620, 888, 44);
  ctx.fillStyle = "#0b0d12";
  ctx.font = "600 28px Outfit, sans-serif";
  ctx.fillText("Draftr", 96, 1240);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "todays-thought.png";
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, line: number) {
  const words = text.split(" ");
  let row = "";
  let top = y;
  for (const word of words) {
    const next = row ? `${row} ${word}` : word;
    if (ctx.measureText(next).width > max) {
      ctx.fillText(row, x, top);
      row = word;
      top += line;
    } else row = next;
  }
  if (row) ctx.fillText(row, x, top);
}
