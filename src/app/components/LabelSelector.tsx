import React from "react";

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
  const handleDescriptionChange = (label: string, value: string) => {
    setDescriptions((prev) => ({
      ...prev,
      [label]: value,
    }));
  };

  return (
    <div className="ml-2 mb-6">
      <h2 className="text-[20px] font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent tracking-tight mb-2 leading-5">
        {title}
      </h2>
      <p className="mb-2 text-xs text-gray-600 italic">
        <span className="text-red-600">**</span>A description is required for
        every car part marked as damaged.
      </p>
      <hr className="mb-2 border-gray-300" />
      <ul className="space-y-2">
        {Object.keys(labelsMap).map((label) => {
          const isChecked = isLabelChecked(label);
          return (
            <li key={label} className="flex flex-col gap-1">
              <label
                htmlFor={label}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id={label}
                  checked={isChecked}
                  onChange={() => toggleLabel(label)}
                  className="sr-only peer"
                />
                <div
                  className={`w-4 h-4 rounded border-2 transition-all duration-150 ${
                    isChecked
                      ? "bg-orange-500 border-orange-600"
                      : "border-gray-400"
                  } peer-focus:ring-2 peer-focus:ring-orange-400 flex items-center justify-center`}
                >
                  {isChecked && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-light text-gray-800 leading-relaxed">
                  {label}
                </span>
              </label>

              {/* Conditional damage description field */}
              {isChecked && (
                <textarea
                  required
                  placeholder="Describe the damage..."
                  className="mt-1 mr-2 p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-800"
                  value={descriptions[label] || ""}
                  onChange={(e) =>
                    handleDescriptionChange(label, e.target.value)
                  }
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default LabelSelector;
