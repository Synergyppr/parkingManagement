import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PropertyProvider } from "./context/PropertyContext";
// import Footer from "@/app/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Login - Parkey",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Restore cached property colors before React hydrates to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem("themeColors_primary");var s=localStorage.getItem("themeColors_secondary");var r=document.documentElement.style;if(p){r.setProperty("--primary",p);r.setProperty("--primary-light","color-mix(in srgb, "+p+" 35%, white)");r.setProperty("--primary-soft","color-mix(in srgb, "+p+" 10%, white)")}if(s){r.setProperty("--secondary",s);r.setProperty("--secondary-light","color-mix(in srgb, "+s+" 35%, white)");r.setProperty("--secondary-soft","color-mix(in srgb, "+s+" 10%, white)")}}catch(e){}})();`,
          }}
        />
        <div className="flex flex-col min-h-screen">
          <PropertyProvider>
            <main className="grow z-20">{children}</main>
            {/* <Footer /> */}
          </PropertyProvider>
        </div>
      </body>
    </html>
  );
}
