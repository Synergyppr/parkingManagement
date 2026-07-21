// TermsAndConditions.tsx
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

const getStoredThemeColor = (key: "primaryColor" | "secondaryColor") => {
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

    if (paletteByName) {
      return paletteByName;
    }
  }

  const storedPrimary = getStoredThemeColor("primaryColor");
  const storedSecondary = getStoredThemeColor("secondaryColor");

  if (!storedPrimary || !storedSecondary) {
    return undefined;
  }

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

  /*
   * PropertyContext can still be empty during the initial render.
   * Preserve the saved theme instead of overwriting it with amber.
   */
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

  const contextPalette = findThemePalette(resolvedPrimary, resolvedSecondary);

  if (contextPalette) {
    applyPalette(contextPalette);
    return;
  }

  /*
   * Context values may update separately.
   * Preserve the stored palette while the pair is temporarily mismatched.
   */
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

export default function TermsAndConditions() {
  const router = useRouter();

  const { primaryColor, secondaryColor } = useProperty();

  useEffect(() => {
    applyThemeColors({
      primaryColor,
      secondaryColor,
    });
  }, [primaryColor, secondaryColor]);

  const tocItems = [
    ["intro", "Introduction"],
    ["use", "1. Use of Service"],
    ["messaging", "2. Messaging"],
    ["liability", "3. Liability"],
    ["modifications", "4. Modifications"],
    ["termination", "5. Termination"],
    ["contact", "6. Contact Us"],
  ];

  return (
    <main className="min-h-screen bg-(--primary-soft) px-4 py-8 text-slate-800">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.08),transparent_42%)]" />

      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-4xl border border-[color-mix(in_srgb,var(--primary-light)_70%,transparent)] bg-white/90 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-linear-to-br from-white via-[color-mix(in_srgb,var(--primary-soft)_70%,transparent)] to-white px-5 py-6 md:px-8">
          <div className="flex flex-col items-center gap-4 text-center md:grid md:grid-cols-[25%_75%] md:text-left">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex max-w-50 items-center gap-3 rounded-full border border-(--primary-light) bg-white px-4 py-2 shadow-sm transition 
              hover:bg-(--primary-soft) cursor-pointer"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-[0_14px_32px_color-mix(in_srgb,var(--primary)_28%,transparent)]">
                <KeySquare className="h-5 w-5" />
              </div>

              <span className="font-serif text-2xl font-bold text-primary">
                Parkey
              </span>
            </button>

            <div>
              <span className="inline-flex rounded-full border border-(--primary-light) bg-white px-4 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary shadow-sm">
                Legal
              </span>

              <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-950">
                Terms &amp; Conditions
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Please review the terms governing your use of our valet parking
                app and related services.
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
                      className="flex rounded-2xl px-4 py-3 font-bold text-slate-600 transition hover:bg-(--primary-soft) hover:text-primary"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <LegalSection id="intro">
              <p>
                These Terms and Conditions (&quot;Terms&quot;) govern your use
                of our valet parking mobile app and related services
                (&quot;Service&quot;). By accessing or using our Service, you
                agree to these Terms. Please read them carefully.
              </p>
            </LegalSection>

            <LegalSection id="use" title="1. Use of Service">
              <p>
                You must be at least 18 years old to use our valet service. By
                using the app, you agree to provide accurate and up-to-date
                information. Our app is designed to facilitate smooth vehicle
                drop-off and retrieval and to communicate with you regarding the
                status of your vehicle. You agree not to misuse the app or
                disrupt the service in any way.
              </p>
            </LegalSection>

            <LegalSection id="messaging" title="2. Messaging">
              <p>
                By using the app, you consent to receive automated text messages
                or notifications regarding the status of your vehicle. These
                messages may include updates when your car is received, being
                parked, or ready for pickup. Message and data rates may apply
                depending on your carrier.
              </p>
            </LegalSection>

            <LegalSection id="liability" title="3. Liability">
              <p>
                While we strive to provide a secure and professional valet
                experience, we are not liable for any damage, loss, or theft
                occurring to vehicles unless caused by gross negligence or
                misconduct by our staff. We encourage you not to leave personal
                belongings inside your vehicle when using the valet service.
              </p>
            </LegalSection>

            <LegalSection id="modifications" title="4. Modifications">
              <p>
                We reserve the right to update or modify these Terms at any time
                without prior notice. Continued use of the Service after changes
                means you accept the revised terms.
              </p>
            </LegalSection>

            <LegalSection id="termination" title="5. Termination">
              <p>
                We may suspend or terminate your access to the Service if you
                violate these Terms or engage in any harmful conduct.
              </p>
            </LegalSection>

            <LegalSection id="contact" title="6. Contact Us">
              <p>
                If you have any questions about these Terms or our{" "}
                <a
                  className="font-bold text-primary underline decoration-(--primary-light) underline-offset-4 transition hover:text-secondary"
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
                , please contact our support team at{" "}
                <a
                  href="mailto:services@synergyppr.com"
                  className="font-bold text-primary underline decoration-(--primary-light) underline-offset-4 transition hover:text-secondary"
                >
                  services@synergyppr.com
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
