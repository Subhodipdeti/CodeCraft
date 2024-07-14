// Third party imports
import Image from "next/image";
import React, { useState } from "react";
import {
  LayoutPanelLeft,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Search,
} from "lucide-react";
import Fuse from "fuse.js";
import parse from "html-react-parser";
import { getIcon } from "material-file-icons";
import fileExtension from "file-extension";

// Local imports
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useFileExplorerStore, useEditorStore } from "@/stores";
import { ActionTooltip } from "./ui/action-tooltip";
import LangConstant from "@/constants/languages";
import { FileData } from "@/stores/file-explorer-store";

const fuseOptions = {
  isCaseSensitive: true,
  fieldNormWeight: 1,
  keys: ["name"],
};

interface CommandDialogDemoProps {
  files: FileData[];
}

interface Item {
  name: string;
  id: number;
  type: string;
  parent: number;
  children: number[];
  path: string;
  template: string;
}

interface DataObject {
  item: Item;
  refIndex: number;
}

export function CommandDialogDemo({ files }: CommandDialogDemoProps) {
  const [open, setOpen] = useState(false);
  const { setCurrentFilePath } = useEditorStore((state) => state);

  const [filesData, setFilesData] = useState<DataObject[]>([]);
  const fuse = new Fuse(files, fuseOptions);

  const onSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setFilesData(fuse.search(query));
  };

  const handleSelect = (data: DataObject) => {
    const element = data.item;
    setCurrentFilePath({
      id: element.id,
      name: element.name,
      path: element.path,
      language:
        LangConstant.languages[`.${fileExtension(element.name)}`] || ".text",
      template: element.template,
    });
    setOpen(false);
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="w-3/5 max-w-[35vw] py-[2px] flex items-center justify-center border border-[--vscode-commandCenter-border] bg-[--vscode-commandCenter-background] select-none rounded-md px-4 cursor-pointer"
      >
        <Search className="h-4 w-4 text-[--vscode-titleBar-inactiveForeground] mr-1" />

        <span className="text-sm text-[--vscode-titleBar-inactiveForeground]">
          Workspace
        </span>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            type="text"
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Type a command or search..."
            onChange={onSearch}
          />
        </div>
        <CommandList className="mt-2">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            {filesData?.length > 0
              ? filesData.map((fd: DataObject) => {
                  return (
                    <CommandItem
                      key={fd?.item?.id}
                      className="flex gap-1"
                      onSelect={() => handleSelect(fd)}
                    >
                      <div className="h-4 w-4">
                        {parse(getIcon(fd.item.name).svg)}
                      </div>{" "}
                      <span>{fd.item.name}</span>
                    </CommandItem>
                  );
                })
              : null}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

const Header = () => {
  const { files } = useFileExplorerStore((state) => state);

  return (
    <header
      className="h-12 w-full px-4 bg-secondary dark:bg-[--vscode-activityBar-background] flex items-center justify-between
      border bottom-[--vscode-titleBar-border]
  "
    >
      <div className="w-1/8">
        {/* Title Bar Will Be Here */}
        <Image
          src="/assets/images/visual-studio-code-logo.png"
          width={35}
          height={35}
          alt="visual-studio-code-logo"
          objectFit="cover"
          objectPosition="center"
        />
      </div>

      <CommandDialogDemo files={files} />

      <div className="w-28 flex justify-end">
        {/* <ThemeToggle /> */}
        <ActionTooltip side="bottom" align="center" label="Toggle Primary">
          <button className="group relative w-full flex items-center justify-center">
            <PanelLeft
              size={20}
              className="shrink-0 text-muted-foreground  group-hover:text-[--vscode-activityBar-foreground]"
            />
          </button>
        </ActionTooltip>

        <ActionTooltip side="bottom" align="center" label="Toggle Primary">
          <button className="group relative w-full flex items-center justify-center">
            <PanelBottom
              size={20}
              className="shrink-0 text-muted-foreground  group-hover:text-[--vscode-activityBar-foreground]"
            />
          </button>
        </ActionTooltip>

        <ActionTooltip side="bottom" align="center" label="Toggle Primary">
          <button className="group relative w-full flex items-center justify-center">
            <PanelRight
              size={20}
              className="shrink-0 text-muted-foreground  group-hover:text-[--vscode-activityBar-foreground]"
            />
          </button>
        </ActionTooltip>

        <ActionTooltip side="bottom" align="center" label="Toggle Primary">
          <button className="group relative w-full flex items-center justify-center">
            <LayoutPanelLeft
              size={20}
              className="shrink-0 text-muted-foreground  group-hover:text-[--vscode-activityBar-foreground]"
            />
          </button>
        </ActionTooltip>
      </div>
    </header>
  );
};

export default Header;
