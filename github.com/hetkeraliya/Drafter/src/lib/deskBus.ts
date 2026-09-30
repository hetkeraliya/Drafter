type DeskRequest = {
  text: string;
  onApply?: (text: string) => void;
};

type Listener = (request: DeskRequest) => void;

const listeners = new Set<Listener>();

export function openDesk(request: DeskRequest = { text: "" }) {
  listeners.forEach((listener) => listener(request));
}

export function onDesk(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
