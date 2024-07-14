"use client";
// Third party imports
import React, { forwardRef, useRef, useState } from "react";
import { FilePlus, FolderPlus } from "lucide-react";

// LOcal imports
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import emitter from "@/hooks/events";
import { cn } from "@/lib/utils";
import { StorageUtils } from "@/lib/storage";
import Tree from "../tree/tree";
import { Button } from "../ui/button";
import { useFileExplorerStore } from "@/stores";
import { SidebarConstants, StorageConstant } from "@/constants";

type FileType = "file" | "folder";

interface TreeNode {
  id: string;
  label: string;
  children: TreeNode[];
  type: string;
  path: string;
  template: string;
}

interface Folder {
  id: string;
  type: FileType;
  children: (Folder | CustomFile)[];
}

interface CustomFile {
  id: string;
  type: FileType;
  template: string;
}

interface SidebarProps {
  isSidebarOpen: boolean;
  onHandelMouseDown: (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => void;
}

interface FileStructure {
  id: number;
  name: string;
  label: string;
  type: FileType;
  path: string;
  template: string;
  parent?: number;
  children: number[];
}

function generateFileStructure(fileList: FileList) {
  const result: FileStructure[] = [];
  const foldersMap = new Map();
  let rootNodeChildren: number[] = [];

  for (let index = 0; index < fileList.length; index++) {
    // can includes all the ignore types
    if (fileList[index]?.name === ".DS_Store") {
      continue;
    }
    const pathSegments = fileList[index].webkitRelativePath.split("/");

    let parentFolderId = 0; // root folder's id is 0
    let currentPath = "";

    pathSegments.slice(0, index + 1);

    pathSegments.forEach(async (segment: string, segmentIndex: number) => {
      currentPath += (segmentIndex === 0 ? "" : "/") + segment;
      const existingFolder = foldersMap.get(currentPath);
      const nodeTypes = determineFileSystemItem(
        fileList[index].webkitRelativePath
      );

      const content =
        nodeTypes[segmentIndex] == "file"
          ? await getContent(fileList[index])
          : "";

      if (!existingFolder) {
        const folderId = result.length + 1; // id starts from 1
        const folder = {
          id: folderId,
          name: segment,
          label: segment,
          type: nodeTypes[segmentIndex] as FileType,
          parent: parentFolderId,
          children: [],
          path: currentPath,
          template: `${content}`,
        };

        result.push(folder);
        foldersMap.set(currentPath, folderId);

        if (parentFolderId !== 0) {
          const parentFolderIndex = result.findIndex(
            (item: FileStructure) => item.id === parentFolderId
          );
          result[parentFolderIndex].children.push(folderId);
        }

        if (parentFolderId === 0) {
          rootNodeChildren.push(folderId);
        }

        parentFolderId = folderId;
      } else {
        parentFolderId = existingFolder;
      }
    });
  }

  const rootNode: FileStructure = {
    id: 0,
    name: "root",
    label: "root",
    parent: null as unknown as number,
    type: "file",
    path: "//root",
    template: "",
    children: rootNodeChildren,
  };

  result.unshift(rootNode);

  return result;
}

function determineFileSystemItem(path: string) {
  const segments = path.split("/");
  const result = [];

  for (let i = 0; i < segments.length; i++) {
    let item;
    item =
      i === segments.length - 1 && segments[i].includes(".")
        ? "file"
        : "folder";
    result.push(item);
  }
  return result;
}

function getContent(selectedFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const content = event.target?.result as string;
      resolve(content);
    };

    reader.onerror = function (event) {
      reject(event.target?.error);
    };

    reader.readAsText(selectedFile);
  });
}

function convertToFolderTree(
  arr: (Folder | CustomFile | TreeNode)[]
): Record<string, object> {
  const result: Record<string, object> = {};
  arr.forEach((item) => {
    if ((item as Folder).type === "folder") {
      const folder = item as Folder;
      result[item.id] = {
        directory: convertToFolderTree(folder.children),
      };
    } else if ((item as CustomFile).type === "file") {
      const file = item as CustomFile;
      result[item.id] = {
        file: {
          contents: `${file.template}`,
        },
      };
    }
  });
  return result;
}

async function buildFolderTree(fileList: FileList): Promise<TreeNode[]> {
  const tree: TreeNode[] = [];

  let index = 0;

  for (let i = 0; i < fileList.length; i++) {
    index = 0;
    const file = fileList[i];
    const segments = file.webkitRelativePath.split("/");
    let currentNode = tree;
    const nodeTypes = determineFileSystemItem(file.webkitRelativePath);

    for (const segment of segments) {
      const existingNode = currentNode.find((node) => node.id === segment);

      if (!existingNode) {
        const content =
          nodeTypes[index] == "file" ? await getContent(file) : "";
        const newNode: TreeNode = {
          id: segment,
          label: segment,
          type: nodeTypes[index],
          path: segments.slice(0, index + 1).join("/"),
          children: index === segments.length - 1 ? [] : [],
          template: `${content}`,
        };
        currentNode.push(newNode);
        currentNode = newNode.children;
      } else {
        currentNode = existingNode.children;
      }
      index++; // Increment index
    }
  }

  // Sort the children of each node by type (folders first)
  const sortChildrenByType = (node: TreeNode): void => {
    node.children.sort((a, b) => {
      if (a.type === "folder" && b.type === "file") {
        return -1;
      } else if (a.type === "file" && b.type === "folder") {
        return 1;
      } else {
        return a.label.localeCompare(b.label);
      }
    });
    node.children.forEach(sortChildrenByType);
  };

  tree.forEach(sortChildrenByType);

  return tree;
}

const Sidebar = forwardRef<React.ElementRef<"div">, SidebarProps>(
  ({ isSidebarOpen, onHandelMouseDown, ...props }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formattedTreeData, setFormattedTreeData] = useState<FileStructure[]>(
      []
    );
    const { setFiles } = useFileExplorerStore((state) => state);

    const onHandelFileChange = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (event.target.files) {
        const treeData = generateFileStructure(event.target.files);
        setFiles(treeData);
        setFormattedTreeData(treeData);

        const response: TreeNode[] = await buildFolderTree(event.target.files);
        StorageUtils.removeFromStorage(StorageConstant.FILE_TREE_KEY);
        StorageUtils.setInStorage(
          StorageConstant.FILE_TREE_KEY,
          convertToFolderTree(response)
        );
      }
    };

    const handelFileCreate = (event: React.MouseEvent) => {
      event.preventDefault();
      emitter.emit("message", {
        type: SidebarConstants.FILE_EVENT.CREATE_FILE,
        data: undefined,
      });
    };

    const handelFolderCreate = (event: React.MouseEvent) => {
      event.preventDefault();
      emitter.emit("message", {
        type: SidebarConstants.FILE_EVENT.CREATE_FOLDER,
        data: undefined,
      });
    };

    return (
      <div
        ref={ref}
        className={cn(
          "group/sidebar relative h-full w-[266px] bg-[--vscode-sideBar-background] border-r border-[--vscode-multiDiffEditor-border]",
          isSidebarOpen ? "" : "hidden"
        )}
        {...props}
      >
        <div className="h-8 w-full py-2 pl-6">
          <h2 className="uppercase text-xs text-[--vscode-sideBarTitle-foreground]">
            Explorer
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="w-full flex flex-row gap-1 hover:cursor-pointer">
              <div className="h-6 w-full flex gap-1 items-center">
                <span className="inset-0 text-xs font-bold transition-transform opacity-[0.8]">
                  WORKSPACE
                </span>
              </div>
              <div className="flex gap-2 pr-2 opacity-0 group-hover/sidebar:opacity-100 transition">
                <FilePlus
                  onClick={handelFileCreate}
                  size={20}
                  className="inset-0 text-[--vscode-sideBarTitle-foreground] transition-transform opacity-[0.8]"
                />
                <FolderPlus
                  role="button"
                  onClick={handelFolderCreate}
                  size={20}
                  className="inset-0 text-[--vscode-sideBarTitle-foreground] transition-transform opacity-[0.8]"
                />
              </div>
            </AccordionTrigger>
            <AccordionContent className="h-[calc(100vh-135px)] overflow-y-scroll pb-0">
              {/* Tree View Will Be Here */}
              {formattedTreeData?.length > 0 ? (
                <Tree treeData={formattedTreeData} />
              ) : (
                <div className="px-3">
                  <p className="my-4 text-sm font-normal text-muted-foreground">
                    You have not yet opened a folder.
                  </p>
                  <Button
                    variant="vs-button"
                    size="sm"
                    className="w-full"
                    onClick={() => fileInputRef?.current?.click()}
                  >
                    Open Folder
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Dragger */}
        <div
          onMouseDown={onHandelMouseDown}
          className="opacity-0 group-hover/sidebar:opacity-100 transition cursor-ew-resize absolute h-full w-1 right-0 top-0 hover:bg-[--vscode-statusBarItem-remoteBackground]"
        />

        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          // @ts-ignore
          directory=""
          webkitdirectory=""
          onChange={onHandelFileChange}
        />
      </div>
    );
  }
);

export default Sidebar;
