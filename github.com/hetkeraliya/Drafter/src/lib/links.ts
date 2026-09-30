export function extractLinks(text: string) {
  const matches = text.match(/https?:\/\/[^\s)]+/gi) || [];
  return [...new Set(matches)].slice(0, 6).map((url) => {
    try {
      const parsed = new URL(url);
      return { url, host: parsed.hostname.replace(/^www\./, "") };
    } catch {
      return { url, host: url };
    }
  });
}
