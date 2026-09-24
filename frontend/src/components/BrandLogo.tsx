export function BrandLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`leading-none ${className}`}>
      <span
        style={{ fontSize: size * 0.5 }}
        className="font-black italic text-orange-500 tracking-tight block"
      >
        novarota
      </span>
      <div
        style={{ fontSize: Math.max(size * 0.13, 9) }}
        className="tracking-[0.2em] uppercase mt-1 text-slate-500"
      >
        cardápio.
      </div>
    </div>
  );
}
