import type { Metadata } from "next";
import "../globals.css";
import { SignalRProvider } from "../lib/SignalRProvider";
import { PropertyProvider } from "../context/PropertyContext";

export const metadata: Metadata = {
  title: "Request My Vehicle - Parkey",
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
    <div>
      <PropertyProvider>
        <SignalRProvider>
          <main>{children}</main>
        </SignalRProvider>
      </PropertyProvider>
    </div>
  );
}
