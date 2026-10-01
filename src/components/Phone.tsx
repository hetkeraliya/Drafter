export function Phone({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh">
      <div className={`rise mx-auto w-full px-5 pb-28 pt-6 sm:px-8 ${wide ? "max-w-[1120px]" : "max-w-[720px]"}`}>
        {children}
      </div>
    </div>
  );
}
