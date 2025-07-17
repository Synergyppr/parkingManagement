"use client";
import { useEffect, useRef } from "react";
import { useProperty } from "../context/PropertyContext";
import { isWithinRadius } from "../lib/clientUtils";
import { leaveGroup } from "../lib/SignalRProvider";

export default function usePropertyListener() {
  const {
    latitude,
    longitude,
    predefinedProperties,
    propertyId,
    setPropertyId,
    setPropertyName,
    setIsOutOfArea,
  } = useProperty();

  const hasEvaluatedRef = useRef(false);

  useEffect(() => {
    if (
      latitude == null ||
      longitude == null ||
      !Object.values(predefinedProperties).length
    ) {
      return;
    }

    // Avoid re-evaluating after initial match
    if (hasEvaluatedRef.current) return;

    const matched = Object.values(predefinedProperties).find((prop) =>
      isWithinRadius(
        prop.lat,
        prop.lng,
        latitude,
        longitude,
        prop.radius ?? 100
      )
    );

    if (matched) {
      if (propertyId !== matched.id) {
        setPropertyId(matched.id);
        setPropertyName(matched.name || "");
      }
      setIsOutOfArea(false);
    } else {
      if (propertyId) {
        leaveGroup(propertyId);
        setPropertyId("");
        setPropertyName("");
      }
      setIsOutOfArea(true);
    }

    hasEvaluatedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, predefinedProperties]);
}
