import { Spark } from "./Spark";

export function AppIcon({ size = 72 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2237,
        background: "linear-gradient(160deg, #2e2e2e 0%, #000000 62%)",
        color: "#ffffff",
        boxShadow: "0 18px 36px -14px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.28), inset 0 0 0 0.5px rgba(255, 255, 255, 0.22)",
      }}
    >
      <Spark size={size * 0.46} />
    </div>
  );
}
