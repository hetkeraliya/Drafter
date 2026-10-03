import { Spark } from "./Spark";

export function AppIcon({ size = 72 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center text-white"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2237,
        background: "linear-gradient(160deg, #5ac8fa 0%, #007aff 55%, #5856d6 100%)",
        boxShadow: "0 8px 22px rgba(0, 122, 255, 0.3), inset 0 0 0 0.5px rgba(255, 255, 255, 0.25)",
      }}
    >
      <Spark size={size * 0.46} />
    </div>
  );
}
