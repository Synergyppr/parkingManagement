// PrivacyPolicy.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeySquare } from "lucide-react";
import { useProperty } from "../context/PropertyContext";

const DEFAULT_PRIMARY_COLOR = "#d97706";
const DEFAULT_SECONDARY_COLOR = "#f59e0b";
const THEME_STORAGE_KEY = "parkey-theme";

type ThemePalette = {
  name: string;
  primary: string;
  primaryLight: string;
  primarySoft: string;
  secondary: string;
  secondaryLight: string;
  secondarySoft: string;
};

const THEME_PALETTES: ThemePalette[] = [
  {
    name: "amber",
    primary: "#d97706",
    primaryLight: "#fbbf24",
    primarySoft: "#fffbeb",
    secondary: "#f59e0b",
    secondaryLight: "#fcd34d",
    secondarySoft: "#fef3c7",
  },
  {
    name: "sapphire",
    primary: "#2563eb",
    primaryLight: "#60a5fa",
    primarySoft: "#eff6ff",
    secondary: "#3b82f6",
    secondaryLight: "#93c5fd",
    secondarySoft: "#dbeafe",
  },
  {
    name: "emerald",
    primary: "#059669",
    primaryLight: "#34d399",
    primarySoft: "#ecfdf5",
    secondary: "#10b981",
    secondaryLight: "#6ee7b7",
    secondarySoft: "#d1fae5",
  },
  {
    name: "royal",
    primary: "#7c3aed",
    primaryLight: "#a78bfa",
    primarySoft: "#f5f3ff",
    secondary: "#8b5cf6",
    secondaryLight: "#c4b5fd",
    secondarySoft: "#ede9fe",
  },
  {
    name: "ruby",
    primary: "#dc2626",
    primaryLight: "#f87171",
    primarySoft: "#fef2f2",
    secondary: "#ef4444",
    secondaryLight: "#fca5a5",
    secondarySoft: "#fee2e2",
  },
  {
    name: "teal",
    primary: "#0f766e",
    primaryLight: "#2dd4bf",
    primarySoft: "#f0fdfa",
    secondary: "#14b8a6",
    secondaryLight: "#5eead4",
    secondarySoft: "#ccfbf1",
  },
  {
    name: "rose",
    primary: "#db2777",
    primaryLight: "#f472b6",
    primarySoft: "#fdf2f8",
    secondary: "#ec4899",
    secondaryLight: "#f9a8d4",
    secondarySoft: "#fce7f3",
  },
  {
    name: "obsidian",
    primary: "#111827",
    primaryLight: "#d4af37",
    primarySoft: "#f9f5e7",
    secondary: "#d4af37",
    secondaryLight: "#f4d675",
    secondarySoft: "#fef9e7",
  },
];

const isValidThemeColor = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const color = value.trim();
  return (
    /^#[0-9a-fA-F]{3}$/.test(color) ||
    /^#[0-9a-fA-F]{6}$/.test(color) ||
    /^#[0-9a-fA-F]{8}$/.test(color) ||
    /^rgb(a)?\(/i.test(color) ||
    /^hsl(a)?\(/i.test(color)
  );
};

const normalizeThemeColor = (value: string) => value.trim().toLowerCase();

const getStoredThemeColor = (
  key: "primaryColor" | "secondaryColor"
) => {
  if (typeof window === "undefined") return null;
  const storedColor = localStorage.getItem(key);
  return isValidThemeColor(storedColor) ? storedColor.trim() : null;
};

const findThemePalette = (
  primaryColor?: string | null,
  secondaryColor?: string | null
) => {
  if (!isValidThemeColor(primaryColor) || !isValidThemeColor(secondaryColor)) {
    return undefined;
  }

  const primary = normalizeThemeColor(primaryColor);
  const secondary = normalizeThemeColor(secondaryColor);

  return THEME_PALETTES.find(
    (palette) =>
      normalizeThemeColor(palette.primary) === primary &&
      normalizeThemeColor(palette.secondary) === secondary
  );
};

const getStoredPalette = () => {
  if (typeof window === "undefined") return undefined;

  const storedThemeName = localStorage.getItem(THEME_STORAGE_KEY);

  if (storedThemeName) {
    const paletteByName = THEME_PALETTES.find(
      (palette) => palette.name === storedThemeName
    );

    if (paletteByName) return paletteByName;
  }

  const storedPrimary = getStoredThemeColor("primaryColor");
  const storedSecondary = getStoredThemeColor("secondaryColor");

  if (!storedPrimary || !storedSecondary) return undefined;

  return findThemePalette(storedPrimary, storedSecondary);
};

const applyPalette = (palette: ThemePalette) => {
  const root = document.documentElement;

  root.dataset.theme = palette.name;

  root.style.setProperty("--primary", palette.primary);
  root.style.setProperty("--primary-light", palette.primaryLight);
  root.style.setProperty("--primary-soft", palette.primarySoft);
  root.style.setProperty("--secondary", palette.secondary);
  root.style.setProperty("--secondary-light", palette.secondaryLight);
  root.style.setProperty("--secondary-soft", palette.secondarySoft);

  localStorage.setItem("primaryColor", palette.primary);
  localStorage.setItem("secondaryColor", palette.secondary);
  localStorage.setItem(THEME_STORAGE_KEY, palette.name);
};

const applyCustomTheme = (primary: string, secondary: string) => {
  const root = document.documentElement;

  root.removeAttribute("data-theme");
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--secondary", secondary);
  root.style.setProperty(
    "--primary-light",
    `color-mix(in srgb, ${primary} 35%, white)`
  );
  root.style.setProperty(
    "--primary-soft",
    `color-mix(in srgb, ${primary} 10%, white)`
  );
  root.style.setProperty(
    "--secondary-light",
    `color-mix(in srgb, ${secondary} 35%, white)`
  );
  root.style.setProperty(
    "--secondary-soft",
    `color-mix(in srgb, ${secondary} 10%, white)`
  );

  localStorage.setItem("primaryColor", primary);
  localStorage.setItem("secondaryColor", secondary);
  localStorage.removeItem(THEME_STORAGE_KEY);
};

const applyThemeColors = ({
  primaryColor,
  secondaryColor,
}: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}) => {
  if (typeof window === "undefined") return;

  const hasContextPrimary = isValidThemeColor(primaryColor);
  const hasContextSecondary = isValidThemeColor(secondaryColor);

  if (!hasContextPrimary || !hasContextSecondary) {
    const storedPalette = getStoredPalette();

    if (storedPalette) {
      applyPalette(storedPalette);
      return;
    }

    const storedPrimary = getStoredThemeColor("primaryColor");
    const storedSecondary = getStoredThemeColor("secondaryColor");

    if (storedPrimary && storedSecondary) {
      const storedMatchedPalette = findThemePalette(
        storedPrimary,
        storedSecondary
      );

      if (storedMatchedPalette) {
        applyPalette(storedMatchedPalette);
      } else {
        applyCustomTheme(storedPrimary, storedSecondary);
      }

      return;
    }

    applyPalette(
      THEME_PALETTES.find((palette) => palette.name === "amber") ?? {
        name: "amber",
        primary: DEFAULT_PRIMARY_COLOR,
        primaryLight: "#fbbf24",
        primarySoft: "#fffbeb",
        secondary: DEFAULT_SECONDARY_COLOR,
        secondaryLight: "#fcd34d",
        secondarySoft: "#fef3c7",
      }
    );

    return;
  }

  const resolvedPrimary = primaryColor.trim();
  const resolvedSecondary = secondaryColor.trim();
  const contextPalette = findThemePalette(
    resolvedPrimary,
    resolvedSecondary
  );

  if (contextPalette) {
    applyPalette(contextPalette);
    return;
  }

  const storedPalette = getStoredPalette();

  if (
    storedPalette &&
    (normalizeThemeColor(storedPalette.primary) ===
      normalizeThemeColor(resolvedPrimary) ||
      normalizeThemeColor(storedPalette.secondary) ===
        normalizeThemeColor(resolvedSecondary))
  ) {
    applyPalette(storedPalette);
    return;
  }

  applyCustomTheme(resolvedPrimary, resolvedSecondary);
};

export default function PrivacyPolicy() {
  const router = useRouter();
  const { primaryColor, secondaryColor } = useProperty();

  useEffect(() => {
    applyThemeColors({
      primaryColor,
      secondaryColor,
    });
  }, [primaryColor, secondaryColor]);

  const tocItems = [
    ["intro", "Your Privacy Matters"],
    ["info", "1. Information We Collect"],
    ["use", "2. How We Use Your Information"],
    ["protection", "3. Data Protection"],
    ["cookies", "4. Cookies"],
    ["rights", "5. Your Rights"],
    ["changes", "6. Changes to This Policy"],
    ["contact", "7. Contact Us"],
  ];

  return (
    <main className="min-h-screen bg-(--primary-soft) px-4 py-8 text-slate-800 transition-colors duration-300">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.08),transparent_42%)]" />

      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-4xl border border-(--primary-light) bg-white/90 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-colors duration-300">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-linear-to-br from-white via-(--primary-soft) to-white px-5 py-6 transition-colors duration-300 md:px-8">
          <div className="flex flex-col items-center gap-4 text-center md:grid md:grid-cols-[25%_75%] md:text-left">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex max-w-50 cursor-pointer items-center gap-3 rounded-full border border-(--primary-light) bg-white px-4 py-2 shadow-sm transition-all duration-300 hover:bg-(--primary-soft) focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light)"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)] transition-colors duration-300">
                <KeySquare className="h-5 w-5" />
              </div>

              <span className="font-serif text-2xl font-bold text-primary transition-colors duration-300">
                Parkey
              </span>
            </button>

            <div>
              <span className="inline-flex rounded-full border border-(--primary-light) bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary shadow-sm transition-colors duration-300">
                Legal
              </span>

              <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950">
                Privacy Policy
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Learn how we collect, use, store, and protect information
                related to your valet parking experience.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-8 px-5 py-8 md:grid-cols-[280px_1fr] md:px-8">
          <aside className="md:sticky md:top-36 md:self-start">
            <div className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Table of Contents
              </p>

              <ul className="space-y-2 text-sm">
                {tocItems.map(([href, label]) => (
                  <li key={href}>
                    <a
                      href={`#${href}`}
                      className="flex rounded-2xl px-4 py-3 font-bold text-slate-600 transition-all duration-300 hover:bg-(--primary-soft) hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light)"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 rounded-2xl border border-(--primary-light) bg-(--primary-soft) px-5 py-4 transition-colors duration-300">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary transition-colors duration-300">
                Effective Date
              </p>

              <p className="mt-1 text-sm font-bold text-slate-700">
                July 26, 2025
              </p>
            </div>

            <LegalSection id="intro" title="Your Privacy Matters">
              <p>
                Our mission is to improve your valet experience by offering a
                secure, fast, and efficient way to drop off and retrieve your
                vehicle. As part of this service, we collect and use some of
                your personal data. We value your privacy, and this policy
                explains how we handle your data.
              </p>

              <p className="mt-4">
                This Privacy Policy applies when you use our valet services
                through our app or website. It explains what data we collect,
                how we use it, and your rights regarding that data. Our aim is
                to be transparent about how your data is stored, transmitted,
                and protected.
              </p>
            </LegalSection>

            <LegalSection id="info" title="1. Information We Collect">
              <p>
                We may collect personal information such as your name, mobile
                number, vehicle details, location data, and timestamps related
                to your vehicle drop-off and pick-up. We may also collect your
                email address, IP address, device type, and any other data you
                voluntarily provide through our platform.
              </p>
            </LegalSection>

            <LegalSection id="use" title="2. How We Use Your Information">
              <p>
                Your data is used to operate our services, communicate with you,
                and enhance your experience. Specifically, this includes sending
                timely updates via SMS or app notifications, such as when your
                car is received, parked, or ready for pick-up. We also use
                device usage data to improve security and app performance.
              </p>

              <p className="mt-4">
                We do not sell your personal information to third parties.
                However, we may share data with trusted service providers
                strictly for operational purposes, such as SMS delivery
                platforms.
              </p>
            </LegalSection>

            <LegalSection id="protection" title="3. Data Protection">
              <p>
                All communications are encrypted and stored securely. We
                implement industry-standard security measures to protect your
                personal data from unauthorized access, misuse, or disclosure.
              </p>
            </LegalSection>

            <LegalSection id="cookies" title="4. Cookies">
              <p>
                Our website may use cookies to enhance your experience and
                gather usage analytics. You can disable cookies in your browser
                settings at any time.
              </p>
            </LegalSection>

            <LegalSection id="rights" title="5. Your Rights">
              <p>
                You have the right to access, correct, or delete your personal
                data at any time by contacting our support team. For more
                details, you may refer to our Cookie Policy and Data Settings or
                reach out via our help page.
              </p>
            </LegalSection>

            <LegalSection id="changes" title="6. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. Any changes
                will be posted on this page with the updated effective date.
              </p>
            </LegalSection>

            <LegalSection id="contact" title="7. Contact Us">
              <p>
                If you have any questions or concerns about this Privacy Policy,
                please contact us at{" "}
                <a
                  href="mailto:services@synergyppr.com"
                  className="font-bold text-primary underline decoration-(--primary-light) underline-offset-4 transition-colors duration-300 hover:text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light)"
                >
                  services@synergyppr.com
                </a>
                .
              </p>

              <p className="mt-4">
                Read our{" "}
                <a
                  className="font-bold text-primary underline decoration-(--primary-light) underline-offset-4 transition-colors duration-300 hover:text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-light)"
                  href="/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms &amp; Conditions
                </a>
                .
              </p>
            </LegalSection>
          </section>
        </div>
      </div>
    </main>
  );
}

function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-40 border-b border-slate-200 py-6 last:border-b-0"
    >
      {title && (
        <h2 className="mb-3 font-serif text-2xl font-bold text-slate-950">
          {title}
        </h2>
      )}

      <div className="text-sm leading-7 text-slate-600">{children}</div>
    </section>
  );
}
