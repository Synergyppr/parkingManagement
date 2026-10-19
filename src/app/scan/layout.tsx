import type { Metadata } from "next";
import "../globals.css";
import { PropertyProvider } from "../context/PropertyContext";

export const metadata: Metadata = {
  title: "Scan Ticket - Parkey",
  description: "Scan a valet ticket to view and update rate",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function ScanLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <PropertyProvider>
        <main>{children}</main>
      </PropertyProvider>
    </div>
  );
}
