import React, { useEffect, useState } from "react";

interface Props {
  labelsMap: Record<string, string[]>;
  isLabelChecked: (label: string) => boolean;
  toggleLabel: (label: string) => void;
  title: string;
  setDescriptions: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  descriptions: Record<string, string>;
}

const LabelSelector: React.FC<Props> = ({
  labelsMap,
  isLabelChecked,
  toggleLabel,
  title,
  setDescriptions,
  descriptions,
}) => {
  const [localChecked, setLocalChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initialCheckedState: Record<string, boolean> = {};
    Object.keys(labelsMap).forEach((label) => {
      initialCheckedState[label] = isLabelChecked(label);
    });
    setLocalChecked(initialCheckedState);
  }, [labelsMap, isLabelChecked]);

  const handleDescriptionChange = (label: string, value: string) => {
    setDescriptions((prev) => ({
      ...prev,
      [label]: value,
    }));
  };

  const handleToggle = (label: string) => {
    setLocalChecked((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
    toggleLabel(label);
  };

  return (
    <div
      className="mb-6 rounded-4xl border border-[color-mix(in_srgb,var(--primary-light)_60%,transparent)] bg-linear-to-br from-white via-white to-[color-mix(in_srgb,var(--primary-soft)_40%,transparent)] p-5
      shadow-[0_10px_40px_rgba(0,0,0,0.06)]"
    >
      <div className="mb-4">
        <h2 className="bg-linear-to-r from-primary via-secondary to-(--secondary-light) bg-clip-text text-[22px] font-black tracking-tight text-transparent">
          {title}
        </h2>

        <p className="mt-2 text-xs text-slate-500 italic">
          <span className="font-bold text-red-500">**</span> A description is
          required for every damaged vehicle part.
        </p>
      </div>

      <div className="mb-4 h-px bg-linear-to-r from-(--primary-light) via-primary to-transparent" />

      <ul className="space-y-3">
        {Object.keys(labelsMap).map((label) => {
          const isChecked = localChecked[label] ?? isLabelChecked(label);

          return (
            <li
              key={label}
              className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                isChecked
                  ? "border-(--primary-light) bg-[color-mix(in_srgb,var(--primary-soft)_50%,transparent)] shadow-sm"
                  : "border-slate-200 bg-white hover:border-(--primary-light) hover:bg-[color-mix(in_srgb,var(--primary-soft)_20%,transparent)]"
              }`}
            >
              <label
                htmlFor={label}
                className="flex cursor-pointer items-center gap-3 px-4 py-3"
              >
                <input
                  type="checkbox"
                  id={label}
                  checked={isChecked}
                  onChange={() => handleToggle(label)}
                  // onClick={() => handleToggle(label)}
                  className="peer sr-only"
                />

                <div
                  onClick={() => handleToggle(label)}
                  className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all duration-300 ${
                    isChecked
                      ? "border-primary bg-primary shadow-[0_4px_12px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isChecked && (
                    <svg
                      className="h-3.5 w-3.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                <div className="flex flex-1 items-center justify-between">
                  <span
                    className={`text-sm font-semibold transition-colors ${
                      isChecked ? "text-primary" : "text-slate-700"
                    }`}
                  >
                    {label}
                  </span>

                  {isChecked && (
                    <span className="rounded-full bg-(--primary-soft) px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-primary">
                      Damaged
                    </span>
                  )}
                </div>
              </label>

              {isChecked && (
                <div className="px-4 pb-4">
                  <textarea
                    required
                    placeholder="Describe the damage..."
                    className="min-h-22.5 w-full rounded-2xl border border-(--primary-light) bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none 
                    transition-all duration-300 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-[color-mix(in_srgb,var(--primary-light)_50%,transparent)]"
                    value={descriptions[label] || ""}
                    onChange={(e) =>
                      handleDescriptionChange(label, e.target.value)
                    }
                  />

                  <div className="mt-2 flex justify-end">
                    <span className="text-[11px] font-medium text-primary">
                      {(descriptions[label] || "").length} characters
                    </span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default LabelSelector;