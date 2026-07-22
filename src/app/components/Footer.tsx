export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/90 backdrop-blur-xl z-1">
      <div className="mx-auto flex min-h-20 max-w-7xl flex-col items-center justify-center gap-1 px-6">
        <div className="h-px w-16 bg-linear-to-r from-transparent via-secondary/80 to-transparent" />

        <p className="text-center text-sm text-slate-500">
          Copyright © {currentYear}{" "}
          <span className="font-semibold text-primary">BBR IT Synergy LLC</span>
        </p>

        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
          Luxury Valet Operations Platform
        </p>
      </div>
    </footer>
  );
}
