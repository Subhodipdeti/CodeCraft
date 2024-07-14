"use client";
import { ActionTooltip } from "@/components/ui/action-tooltip";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  id: number;
  tooltipLabel: string;
  icon: LucideIcon;
  selected: boolean;
  onClick(id: number): void;
}

const ActivityBarItem = ({
  id,
  tooltipLabel,
  selected = false,
  onClick,
  icon: Icon,
}: SidebarItemProps) => {
  return (
    <ActionTooltip key={id} side="right" align="center" label={tooltipLabel}>
      <button
        onClick={() => onClick(id)}
        className="group relative w-full flex items-center justify-center"
      >
        <div
          className={cn(
            "absolute left-0 top-0 bg-[--vscode-activityBar-activeBorder] transition-all w-[2px]",
            selected && "h-12"
          )}
        />
        <div className="relative flex h-12 w-12 items-center justify-center">
          <Icon className="shrink-0 text-muted-foreground  group-hover:text-[--vscode-activityBar-foreground]" />
        </div>
      </button>
    </ActionTooltip>
  );
};

export default ActivityBarItem;
