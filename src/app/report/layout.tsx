import type { Metadata } from "next";
import "../globals.css";
import Header from "@/app/components/Header";
import { SignalRProvider } from "../lib/SignalRProvider";
import { PropertyProvider } from "../context/PropertyContext";

export const metadata: Metadata = {
  title: "Ticket Report - Parkey",
  description: "Luxurious Valet Parking App",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <PropertyProvider>
        <Header />
        <SignalRProvider>
          <main>{children}</main>
        </SignalRProvider>
      </PropertyProvider>
    </div>
  );
}
