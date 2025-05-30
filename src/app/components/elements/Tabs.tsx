import React from "react";

interface TabsProps {
  isSmallScreen: boolean;
  tabs: string[];
  activeTab: any;
  setActiveTab: any;
  setTransitionState: (state: string) => void;
  sessionKey?: string;
  customOnTabChange?: (tab: any, i: number) => void;
}

const Tabs: React.FC<TabsProps> = ({
  isSmallScreen,
  tabs,
  activeTab,
  setActiveTab,
  setTransitionState,
  sessionKey,
  customOnTabChange,
}) => {
  const onTabChange = (item: string) => {
    setTransitionState("fade-out");
    setTimeout(() => {
      setActiveTab(item);
      if (sessionKey) sessionStorage?.setItem(sessionKey, item);
      setTransitionState("fade-in");
    }, 300);
  };

  return (
    <div
      className={`${
        isSmallScreen && tabs?.length > 3
          ? "overflow-x-auto overflow-y-hidden"
          : ""
      } h-full bg-gray-800 pt-1 px-0 justify-between flex md:justify-start lg:justify-start gap-0 md:gap-1 lg:gap-1`}
    >
      {tabs?.map((item: any, i: number) => (
        <div
          onClick={() => {
            if (setActiveTab != null) onTabChange(item);
            else {
              customOnTabChange && customOnTabChange(item, i);
            }
          }}
          key={item}
          className={`py-[12px] px-3 md:px-5 lg:px-5 shadow-sm rounded-x rounded-t text-gray-200 cursor-pointer text-sm flex-1 z-1 border-t-[1px] border-l-[1px] border-r-[1px] border-b-0 ${
            activeTab === item
              ? `border-blue-600 text-gray-200 relative top-[1px] font-bold bg-gray-800`
              : "border-gray-700/50 bg-transparent text-gray-200"
          }`}
        >
          <div
            className={`${
              activeTab === item ? "text-gray-300" : ""
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
