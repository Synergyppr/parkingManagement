"use client";
import { useEffect } from "react";

import { useProperty } from "../context/PropertyContext";
import { applyPropertyTheme } from "../lib/propertyTheme";

export default function usePropertyListener() {
  const { primaryColor, secondaryColor } = useProperty();

  useEffect(() => {
    applyPropertyTheme({
      primaryColor,
      secondaryColor,
    });
  }, [primaryColor, secondaryColor]);
}
