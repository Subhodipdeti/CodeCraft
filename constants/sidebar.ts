import { Files, LucideIcon } from "lucide-react";

interface SidebarT {
  id: number;
  tooltipLabel: string;
  icon: LucideIcon;
}

const sidebarItems: SidebarT[] = [
  {
    id: 1,
    tooltipLabel: "Explorer",
    icon: Files,
  },
];

const FILE_EVENT = {
  CREATE_FILE: "fs-create-file",
  CREATE_FOLDER: "fs-create-folder",
};

export default { sidebarItems, FILE_EVENT };
