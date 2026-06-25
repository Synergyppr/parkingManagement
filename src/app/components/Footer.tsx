export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[80px] max-w-7xl flex-col items-center justify-center gap-1 px-6">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <p className="text-center text-sm text-slate-500">
          Copyright © {currentYear}{" "}
          <span className="font-semibold text-amber-600">
            BBR IT Synergy LLC
          </span>
        </p>

        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Luxury Valet Operations Platform
        </p>
      </div>
    </footer>
  );
}