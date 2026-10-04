import { Spark } from "./Spark";

export function AppIcon({ size = 72 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2237,
        background: "#0b0b0c",
        color: "#ffffff",
        boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.14) inset",
      }}
    >
      <Spark size={size * 0.46} />
    </div>
  );
}
