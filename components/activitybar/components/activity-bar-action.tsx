// Third party imports
import { LucideIcon } from "lucide-react";

interface ActivitybarActionProps {
  icon: LucideIcon;
  onClick: () => void;
}

const ActivitybarAction = ({ icon: Icon, onClick }: ActivitybarActionProps) => {
  return (
    <button
      onClick={onClick}
      className="group relative w-full flex items-center justify-center"
    >
      <div className="relative flex w-12 items-center justify-center">
        <Icon className="shrink-0 text-muted-foreground group-hover:text-[--vscode-activityBar-foreground]" />
      </div>
    </button>
  );
};

export default ActivitybarAction;
