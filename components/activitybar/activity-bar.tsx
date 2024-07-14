"use client";
// Third party imports
import { useState } from "react";
import { Menu, Settings } from "lucide-react";

// Local imports
import sidebarConstants from "@/constants/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ActivityBarAction,
  ActivityBarItem,
} from "@/components/activitybar/components";
import { useActivityBarStore } from "@/stores";

const ActivityBar = () => {
  const [tabId, setTabId] = useState<number>(0);
  const { openSidebar, closeSidebar } = useActivityBarStore((state) => state);

  const onHandelMenu = () => {
    console.log("onHandelMenu Clicked!");
  };

  const onHandelSettings = () => {
    console.log("onHandelSettings Clicked!");
  };

  const handelTabChange = (id: number) => {
    setTabId(id === tabId ? 0 : id);
    if (id === tabId) {
      closeSidebar();
    } else {
      openSidebar();
    }
  };

  return (
    <aside className="h-full py-3 flex flex-col gap-4 items-center w-16 border-r border-r-[--vscode-sideBar-border] bg-[--vscode-sideBar-background]">
      <ActivityBarAction onClick={onHandelMenu} icon={Menu} />
      <div className="mb-auto w-full">
        {sidebarConstants.sidebarItems.map((sideBarItem) => {
          return (
            <ActivityBarItem
              key={sideBarItem.id}
              id={sideBarItem.id}
              tooltipLabel={sideBarItem.tooltipLabel}
              icon={sideBarItem.icon}
              selected={sideBarItem.id === tabId}
              onClick={handelTabChange}
            />
          );
        })}
      </div>

      <ThemeToggle />
      <ActivityBarAction onClick={onHandelSettings} icon={Settings} />
    </aside>
  );
};

export default ActivityBar;
