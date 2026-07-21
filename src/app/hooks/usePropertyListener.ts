"use client";
import { useEffect, useRef } from "react";

import { useProperty } from "../context/PropertyContext";
import { isWithinRadius } from "../lib/clientUtils";
import { applyPropertyTheme } from "../lib/propertyTheme";

export default function usePropertyListener() {
  const {
    latitude,
    longitude,
    predefinedProperties,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    propertyId,
    setPropertyId,
    setPropertyName,
    setIsOutOfArea,
    requestLocation,
  } = useProperty();

  const hasEvaluatedRef = useRef(false);

  /*
   * Apply the colors currently exposed by PropertyContext.
   *
   * This keeps the app theme synchronized when:
   * - the property is loaded from storage;
   * - the property is selected manually;
   * - the API returns updated property colors;
   * - the matched location changes the active property.
   */
  useEffect(() => {
    console.log("Primary", primaryColor);
    console.log("Secondary", secondaryColor);

    applyPropertyTheme({
      primaryColor,
      secondaryColor,
    });
  }, [primaryColor, secondaryColor]);

  /*
   * Match the user's coordinates with a predefined property.
   */
  useEffect(() => {
    const properties = Object.values(predefinedProperties || {});

    if (latitude == null || longitude == null || properties.length === 0) {
      return;
    }

    if (hasEvaluatedRef.current) return;

    const matched = properties.find((property) =>
      isWithinRadius(
        property.lat,
        property.lng,
        latitude,
        longitude,
        property.radius ?? 100
      )
    );

    if (matched) {
      if (propertyId !== matched.id) {
        setPropertyId(matched.id);
        setPropertyName(matched.name || "");
      }

      /*
       * Apply the matched property's colors immediately.
       *
       * PropertyContext should also update primaryColor and
       * secondaryColor after setPropertyId runs, but applying them
       * here prevents a visible flash of the previous theme.
       */
      applyPropertyTheme({
        primaryColor: matched?.primaryColor || primaryColor,
        secondaryColor: matched?.secondaryColor || secondaryColor,
      });

      setIsOutOfArea(false);
    } else {
      setIsOutOfArea(true);
      requestLocation();
    }

    hasEvaluatedRef.current = true;
  }, [
    latitude,
    longitude,
    predefinedProperties,
    propertyId,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    requestLocation,
    setIsOutOfArea,
    setPropertyId,
    setPropertyName,
  ]);

  /*
   * Allow location matching to run again when the active property
   * is cleared, such as during logout or property switching.
   */
  useEffect(() => {
    if (!propertyId) {
      hasEvaluatedRef.current = false;
    }
  }, [propertyId]);
}
