import React from "react";

interface TabsProps {
  isSmallScreen: boolean;
  tabs: string[];
  activeTab: string;
  setActiveTab: (item: string) => void;
  setTransitionState: (state: string) => void;
  customOnTabChange?: (tab: string, i: number) => void;
}

const Tabs: React.FC<TabsProps> = ({
  isSmallScreen,
  tabs,
  activeTab,
  setActiveTab,
  setTransitionState,
  customOnTabChange,
}) => {
  const onTabChange = (item: string) => {
    setTransitionState("fade-out");
    setTimeout(() => {
      setActiveTab(item as string);
      setTransitionState("fade-in");
    }, 300);
  };

  return (
    <div className={`flex gap-1 ${isSmallScreen && tabs?.length > 3 ? "overflow-x-auto" : ""}`}>
      {tabs?.map((item, i) => (
        <button
          key={item}
          type="button"
          onClick={() =>
            setActiveTab != null
              ? onTabChange(item)
              : customOnTabChange?.(item, i)
          }
          className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors cursor-pointer ${
            activeTab === item
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
