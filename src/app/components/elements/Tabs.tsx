import React from "react";

interface TabsProps {
  isSmallScreen: boolean;
  tabs: string[];
  activeTab: string;
  setActiveTab: (item: string) => void;
  setTransitionState: (state: string) => void;
  sessionKey?: string;
  customOnTabChange?: (tab: string, i: number) => void;
}

const Tabs: React.FC<TabsProps> = ({
  isSmallScreen,
  tabs,
  activeTab,
  setActiveTab,
  setTransitionState,
  // sessionKey,
  customOnTabChange,
}) => {
  const onTabChange = (item: string) => {
    setTransitionState("fade-out");
    setTimeout(() => {
      setActiveTab(item as string);
      // if (sessionKey) sessionStorage?.setItem(sessionKey, item);
      setTransitionState("fade-in");
    }, 300);
  };

  return (
    <div
      className={`${
        isSmallScreen && tabs?.length > 3
          ? "overflow-x-auto overflow-y-hidden"
          : ""
      } h-full bg-transparent pt-1 px-0 justify-between flex md:justify-start lg:justify-start gap-0 md:gap-1 lg:gap-1`}
    >
      {tabs?.map((item: string, i: number) => (
        <div
          onClick={() => {
            if (setActiveTab != null) onTabChange(item);
            else {
              customOnTabChange?.(item, i);
            }
          }}
          key={item}
          className={`py-[12px] px-3 md:px-5 lg:px-5 shadow-sm rounded-x rounded-t cursor-pointer text-sm flex-1 z-1 border-t-[1px] border-l-[1px] border-r-[1px] border-b-0 ${
            activeTab === item
              ? `border-blue-600 text-white relative top-[1px] font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600/80`
              : "border-gray-700/50 bg-transparent text-gray-800"
          }`}
        >
          <div
            className={`${
              activeTab === item ? "text-white" : ""
            } m-auto flex flex-col justify-center h-full items-center capitalize`}
          >
            {item}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Tabs;
