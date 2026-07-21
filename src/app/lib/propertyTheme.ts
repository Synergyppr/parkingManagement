// lib/propertyTheme.ts

const DEFAULT_PRIMARY_COLOR = "#d97706";
const DEFAULT_SECONDARY_COLOR = "#fbbf24";

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

  const primary = normalizeHexColor(
    primaryColor,
    DEFAULT_PRIMARY_COLOR
  );

  const secondary = normalizeHexColor(
    secondaryColor,
    DEFAULT_SECONDARY_COLOR
  );

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