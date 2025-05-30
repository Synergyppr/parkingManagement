export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full p-4 text-center text-sm bg-slate-900 text-gray-100 border-t mt-auto">
      Copyright © {currentYear}{" "}
      <span className="font-bold text-blue-500">BBR IT Synergy LLC. </span>
      <span>All rights reserved.</span>
    </footer>
  );
}
