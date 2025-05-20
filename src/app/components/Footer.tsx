export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full p-4 text-center text-sm bg-gray-200 text-gray-600 border-t mt-auto absolute bottom-0  ">
      Copyright @ {currentYear}{" "}
      <span className="font-bold">BBR IT Synergy </span>
      <span>All rights reserved</span>
    </footer>
  );
}
