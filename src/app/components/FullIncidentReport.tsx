import React from "react";

interface Props {
  labelsMap: Record<string, string[]>;
  isLabelChecked: (label: string) => boolean;
  descriptions: Record<string, string>;
  title: string;
}

const FullIncidentReport: React.FC<Props> = ({
  labelsMap,
  isLabelChecked,
  descriptions,
  title,
}) => {
  const reportedLabels = Object.keys(labelsMap).filter(isLabelChecked);

  if (reportedLabels?.length === 0) return null;

  return (
    <section className="mb-6">
      <h3 className="text-lg font-bold text-blue-700 mb-2 tracking-tight">
        {title}
      </h3>
      <ul className="space-y-2 pl-4">
        {reportedLabels?.map((label) => (
          <li key={label} className="border-l-2 border-orange-400 pl-3">
            <article>
              <p className="font-semibold text-gray-800">{label}</p>
              <p className="text-sm text-gray-600">
                {typeof descriptions[label] === "string" &&
                descriptions[label].trim() ? (
                  descriptions[label]
                ) : (
                  <span className="text-gray-400">
                    No description provided.
                  </span>
                )}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default FullIncidentReport;
