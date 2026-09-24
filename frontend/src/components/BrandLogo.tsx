export function BrandLogo({ height = 40, className = '' }: { height?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="NovaRota Marketing"
      style={{ height }}
      className={`w-auto max-w-full object-contain ${className}`}
    />
  );
}
