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
    <div
      className={`${
        isSmallScreen && tabs?.length > 3
          ? "overflow-x-auto overflow-y-hidden"
          : ""
      } h-full bg-transparent pt-1 px-0 justify-between flex md:justify-start lg:justify-start gap-0`}
    >
      <div className="flex overflow-x-auto no-scrollbar whitespace-nowrap bg-transparent pt-1 px-0 gap-0 md:gap-0 w-[85%] md:w-[87.5%]">
        {tabs?.map((item, i) => (
          <div
            key={item}
            onClick={() =>
              setActiveTab != null
                ? onTabChange(item)
                : customOnTabChange?.(item, i)
            }
            className={`flex-1 py-[12px] px-4 shadow-sm rounded-x rounded-t cursor-pointer text-sm min-w-max z-10 ${
              activeTab === item
                ? `border-blue-600 text-white relative top-[1px] font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600/80`
                : "border-slate-700/50 border-[.5px] text-gray-800 bg-slate-200"
            }`}
          >
            <div className={`m-auto flex flex-col items-center capitalize`}>
              {item}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
