import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Valet Parking App | Privacy Policy",
  description: "Privacy Policy",
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
    <div className="bg-slate-200 min-h-[95vh] m-0">
      <main>{children}</main>
    </div>
  );
}
