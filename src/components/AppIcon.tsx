import { Spark } from "./Spark";

export function AppIcon({ size = 72 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center text-white"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2237,
        background: "linear-gradient(150deg, #5eead4 0%, #6a5cff 52%, #c084fc 100%)",
        boxShadow: "0 14px 32px -10px rgba(106, 92, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.45), inset 0 0 0 0.5px rgba(255, 255, 255, 0.3)",
      }}
    >
      <Spark size={size * 0.46} />
    </div>
  );
}
