export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full p-4 text-center text-sm bg-slate-100 text-gray-800 mt-auto shadow-sm">
      Copyright © {currentYear}{" "}
      <span className="font-bold text-blue-500 tracking-tight">BBR IT Synergy LLC. </span>
      <span>All rights reserved.</span>
    </footer>
  );
}
