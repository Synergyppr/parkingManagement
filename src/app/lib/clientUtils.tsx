"use client";
import React, { useEffect } from "react";

export const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  callback: () => void
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.body.style.overflow = "auto";

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
};

//////////////////////////////////////////////////////////////////////////////////////////////////

// Helper function to format date
export const formatDate = (dateTimeString: string | number | Date) => {
  const date = new Date(dateTimeString);

  if (isNaN(date.getTime())) {
    return " ";
  }

  return `${
    date.getMonth() + 1
  }/${date.getDate()}/${date.getFullYear()} ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  })}`;
};

//////////////////////////////////////////////////////////////////////////////////////////////////

export const formatHour = (hour: string) => {
  const date = new Date(hour);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

//////////////////////////////////////////////////////////////////////////////////////////////////

export const formatDateTimePicker = (dateTime: string) => {
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
  return formattedDate;
};

//////////////////////////////////////////////////////////////////////////////////////////////////

export const formatDatePicker = (dateTime: string) => {
  const date = new Date(dateTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

//////////////////////////////////////////////////////////////////////////////////////////////////

export function formatPhoneNumber(value: string): string {
  const rawValue = value.replace(/\D/g, "");

  if (rawValue.length <= 3) {
    return rawValue;
  } else if (rawValue.length <= 6) {
    return `(${rawValue.slice(0, 3)}) ${rawValue.slice(3)}`;
  } else {
    return `(${rawValue.slice(0, 3)}) ${rawValue.slice(3, 6)}-${rawValue.slice(
      6,
      10
    )}`;
  }
}
//////////////////////////////////////////////////////////////////////////////////////////////////
