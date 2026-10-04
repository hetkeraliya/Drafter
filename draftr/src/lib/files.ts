export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export async function compressImage(file: File, max = 1400): Promise<{ url: string; name: string }> {
  const raw = await readAsDataUrl(file);
  const img = document.createElement("img");
  img.src = raw;
  await new Promise((res, rej) => {
    img.onload = () => res(null);
    img.onerror = () => rej(new Error("That image could not be opened."));
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return { url: raw, name: file.name };
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { url: canvas.toDataURL("image/jpeg", 0.78), name: file.name };
}

export async function fileToAttachment(file: File, kind: "image" | "audio" | "file") {
  if (kind === "image") return compressImage(file);
  if (file.size > 4_500_000) {
    throw new Error("Keep files under 4.5 MB for this demo.");
  }
  return { url: await readAsDataUrl(file), name: file.name };
}
