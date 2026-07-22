// lib/propertyTheme.ts

const DEFAULT_PRIMARY_COLOR = "#d97706";
const DEFAULT_SECONDARY_COLOR = "#fbbf24";

export type ThemeName =
  | "amber"
  | "sapphire"
  | "emerald"
  | "royal"
  | "ruby"
  | "teal"
  | "rose"
  | "obsidian"
  | "platinum";

export type ThemeOption = {
  name: ThemeName;
  label: string;
  description: string;
  primary: string;
  secondary: string;
  light: string;
  soft: string;
  // primaryLight?: string;
  // primarySoft?: string;
  // secondaryLight?: string;
  // secondarySoft?: string;
};

export type ThemePalette = {
  name: string;
  primary: string;
  primaryLight: string;
  primarySoft: string;
  secondary: string;
  secondaryLight: string;
  secondarySoft: string;
};

export const THEMES: ThemeOption[] = [
  {
    name: "amber",
    label: "Amber",
    description: "Warm and premium",
    primary: "#d97706",
    secondary: "#f59e0b",
    light: "#fbbf24",
    soft: "#fffbeb",
  },
  {
    name: "sapphire",
    label: "Sapphire",
    description: "Clean and professional",
    primary: "#2563eb",
    secondary: "#3b82f6",
    light: "#60a5fa",
    soft: "#eff6ff",
  },
  {
    name: "emerald",
    label: "Emerald",
    description: "Fresh and confident",
    primary: "#059669",
    secondary: "#10b981",
    light: "#34d399",
    soft: "#ecfdf5",
  },
  {
    name: "royal",
    label: "Royal",
    description: "Bold and elegant",
    primary: "#7c3aed",
    secondary: "#8b5cf6",
    light: "#a78bfa",
    soft: "#f5f3ff",
  },
  {
    name: "ruby",
    label: "Ruby",
    description: "Strong and energetic",
    primary: "#dc2626",
    secondary: "#ef4444",
    light: "#f87171",
    soft: "#fef2f2",
  },
  {
    name: "teal",
    label: "Teal",
    description: "Modern and balanced",
    primary: "#0f766e",
    secondary: "#14b8a6",
    light: "#2dd4bf",
    soft: "#f0fdfa",
  },
  {
    name: "rose",
    label: "Rose",
    description: "Vibrant and refined",
    primary: "#db2777",
    secondary: "#ec4899",
    light: "#f472b6",
    soft: "#fdf2f8",
  },
  {
    name: "obsidian",
    label: "Obsidian",
    description: "Dark luxury with gold",
    primary: "#111827",
    secondary: "#d4af37",
    light: "#d4af37",
    soft: "#f9f5e7",
  },
];

export const THEME_PALETTES: ThemePalette[] = [
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

const normalizeHexColor = (
  color: string | null | undefined,
  fallback: string
) => {
  const normalized = color?.trim();

  if (!normalized) {
    return fallback;
  }

  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized;
  }

  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    return normalized;
  }

  return fallback;
};

export const applyPropertyTheme = ({
  primaryColor,
  secondaryColor,
}: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  const primary = normalizeHexColor(primaryColor, DEFAULT_PRIMARY_COLOR);

  const secondary = normalizeHexColor(secondaryColor, DEFAULT_SECONDARY_COLOR);

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
};

export const clearPropertyTheme = () => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  root.style.removeProperty("--primary");
  root.style.removeProperty("--primary-light");
  root.style.removeProperty("--primary-soft");

  root.style.removeProperty("--secondary");
  root.style.removeProperty("--secondary-light");
  root.style.removeProperty("--secondary-soft");
};
