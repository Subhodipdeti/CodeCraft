import { ChevronsRightLeft, CircleX, TriangleAlert } from "lucide-react";
import { ActionTooltip } from "./ui/action-tooltip";

const Footer = () => {
  return (
    <footer className="h-6 w-full flex fixed bottom-0 bg-[#161616] z-50 border-t border-t-[--vscode-multiDiffEditor-border]">
      {/* <span>This is a Footer</span> */}
      <div className="host h-full flex items-center justify-center w-10 bg-[--vscode-statusBarItem-remoteBackground]">
        <ChevronsRightLeft size={20} />
      </div>

      <div className="px-2">
        <ActionTooltip label="No Problem" side="top" align="center">
          <button className="flex items-center">
            <CircleX size={15} className="text-muted-foreground mr-1" />
            <span className="text-muted-foreground text-sm">0</span>

            <TriangleAlert size={15} className="text-muted-foreground mx-1" />
            <span className="text-muted-foreground text-sm">0</span>
          </button>
        </ActionTooltip>
      </div>
    </footer>
  );
};

export default Footer;
