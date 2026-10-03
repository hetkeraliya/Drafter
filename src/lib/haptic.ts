// Light tick on supported devices (Android / some browsers). Silent no-op elsewhere.
export function haptic(ms = 8) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    /* not supported */
  }
}
