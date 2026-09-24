import { BrandLogo } from './BrandLogo';

export const authInputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';

export const authButtonClass =
  'flex w-full items-center justify-center rounded-md bg-orange-600 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50';

export function AuthLayout({ subtitle, children }: { subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <BrandLogo height={64} />
          <p className="text-center text-xs text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
