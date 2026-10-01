export function speechSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startDictation(onText: (text: string, final: boolean) => void) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.continuous = true;
  rec.interimResults = true;
  rec.lang = "en-US";
  rec.onresult = (event: SpeechRecognitionEvent) => {
    let spoken = "";
    let final = false;
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      spoken += event.results[i][0].transcript;
      if (event.results[i].isFinal) final = true;
    }
    onText(spoken.trim(), final);
  };
  rec.start();
  return rec;
}
