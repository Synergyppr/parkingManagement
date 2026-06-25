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
  const onTabChange = (item: string, i: number) => {
    if (customOnTabChange) {
      customOnTabChange(item, i);
      return;
    }

    setTransitionState("fade-out");

    setTimeout(() => {
      setActiveTab(item);
      setTransitionState("fade-in");
    }, 300);
  };

  return (
    <div
      className={`flex rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm ${
        isSmallScreen && tabs?.length > 3 ? "overflow-x-auto" : ""
      }`}
    >
      {tabs?.map((item, i) => {
        const isActive = activeTab === item;

        return (
          <button
            key={item}
            type="button"
            onClick={() => onTabChange(item, i)}
            className={`relative min-w-fit flex-1 cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold capitalize transition-all duration-200 ${
              isActive
                ? "bg-amber-500 text-white shadow-[0_10px_24px_rgba(217,174,38,0.28)]"
                : "text-slate-500 hover:bg-amber-50 hover:text-amber-700"
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;