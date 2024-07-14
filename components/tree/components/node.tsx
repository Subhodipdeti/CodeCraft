// Third party imports
import { useRef, useState, useEffect, ChangeEvent, Dispatch } from "react";
import fileExtension from "file-extension";
import parse from "html-react-parser";
import { getIcon } from "material-file-icons";
import { useOnClickOutside } from "usehooks-ts";
import { ChevronDown, ChevronRight, Folder } from "lucide-react";

// Local imports
import { TreeNode } from "../tree";
import { useEditorStore } from "@/stores";
import emitter, { MessageType } from "@/hooks/events";
import { SidebarConstants } from "@/constants";
import LangConstant from "@/constants/languages";
import { cn, composeHandlers, getTreeNode, isBranchNode } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface NodeInterface {
  state: {
    treeData: TreeNode[];
    expandedIds: Set<number>;
    halfSelectedIds: Set<number>;
    selectedIds: Set<number>;
    tabSelectedId: number | null;
    isFocused: boolean;
  };
  dispatch: React.Dispatch<any>;
  data: TreeNode[];
  element: TreeNode;
  expandedIds: Set<number>;
  level: number;
}

const Node = ({
  data,
  level,
  state,
  element,
  dispatch,
  expandedIds,
}: NodeInterface) => {
  const { setCurrentFilePath } = useEditorStore((state) => state);
  const [selectedData, setSelectedData] = useState<TreeNode>();
  const [isNodeCreating, setIsNodeCreating] = useState<boolean>(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [nodeType, setNodeType] = useState("");
  const [nodeName, setNodeName] = useState("");
  const [isInputError, setIsInputError] = useState(false);

  const inputRef = useRef(null);

  const handleClickOutside = () => {
    // Your custom logic here
    if (isInputError) {
      setIsNodeCreating(false);
      setIsInputError(false);
      setNodeName("");
      return;
    }
    setIsNodeCreating(false);
  };

  useOnClickOutside(inputRef, handleClickOutside);

  const handleEvent = (message: MessageType) => {
    if (message.type === SidebarConstants.FILE_EVENT.CREATE_FILE) {
      setNodeType("file");
      setIsNodeCreating(true);
    }

    if (message.type === SidebarConstants.FILE_EVENT.CREATE_FOLDER) {
      setNodeType("folder");
      setIsNodeCreating(true);
    }
  };

  const handelExpand = () => {
    dispatch({
      type: "toggle",
      id: element?.id,
    });
  };

  const handleSelect = () => {
    const selectedChildrenNode: string[] = data
      .filter((item: TreeNode) => element.children.includes(item.id))
      ?.map((item: TreeNode) => item.name.toLowerCase());
    setSelectedNodes(selectedChildrenNode);

    setSelectedData(element);

    if (element.type === "file") {
      setCurrentFilePath({
        id: element.id,
        name: element.name,
        path: element.path,
        language:
          LangConstant.languages[`.${fileExtension(element.name)}`] || ".text",
        template: element.template,
      });
    }
    dispatch({
      type: "toggleSelect",
      id: element?.id,
    });
    setNodeName("");
  };

  const handleFocus = () => {
    dispatch({
      type: "focus",
      id: element.id,
    });
  };

  const handleAddNode = (id: number) => {
    if (nodeType === "folder") {
      // This is for folder
      const payloadFolder = {
        id: id,
        name: nodeName,
        type: nodeType,
        children: [],
        parent: selectedData?.id,
        template: "",
        path: `${selectedData?.path}/${nodeName}`,
      };
      dispatch({
        type: "add_node",
        newNode: payloadFolder,
      });

      // This if for file
      const payloadFile = {
        id: id + 1,
        name: ".DS_Store",
        type: "file",
        children: [],
        parent: id,
        template: "",
        path: `${selectedData?.path}/${nodeName}/.DS_Store`,
      };
      dispatch({
        type: "add_node",
        newNode: payloadFile,
      });
    } else {
      const payload = {
        id: id,
        name: nodeName,
        type: nodeType,
        children: [],
        parent: selectedData?.id,
        template: "console.log()",
        path: `${selectedData?.path}/${nodeName}`,
      };
      dispatch({
        type: "add_node",
        newNode: payload,
      });
    }
    setNodeName("");
  };

  const handleDeleteNode = (data: TreeNode) => {
    dispatch({
      type: "delete_node",
      nodeId: data.id,
    });
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setIsInputError(selectedNodes.includes(event.target.value?.toLowerCase()));
    setNodeName(event.target.value);
    event.stopPropagation();
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      if (isInputError) {
        return;
      }

      const maxId = state.treeData.reduce(
        (max: number, item: TreeNode) => (item.id > max ? item.id : max),
        data[0].id
      );
      handleAddNode(maxId + 1);
      setIsNodeCreating(false);
    }
    event.stopPropagation();
  };

  useEffect(() => {
    emitter.on("message", handleEvent);

    return () => {
      emitter.off("message", handleEvent);
    };
  }, [state]);

  const Chevron = state?.expandedIds?.has(element.id)
    ? ChevronDown
    : ChevronRight;

  const onClick = composeHandlers(handleSelect, handelExpand, handleFocus);

  return isBranchNode(data, element?.id) ? (
    <li
      role="treeitem"
      aria-level={level}
      aria-expanded={state?.expandedIds?.has(element.id)}
      tabIndex={state?.tabSelectedId === element.id ? 0 : -1}
      className="select-none"
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            style={{
              paddingLeft: 20 * (level - 1),
            }}
            onClick={onClick}
            className={cn(
              state?.selectedIds?.has(element.id)
                ? "bg-[--vscode-list-inactiveSelectionBackground]"
                : "",
              state?.tabSelectedId === element.id
                ? "bg-[--vscode-toolbar-hoverBackground]"
                : "",
              "h-7 w-full flex gap-1 items-center hover:bg-[--vscode-toolbar-hoverBackground] hover:cursor-pointer"
            )}
          >
            <Chevron
              size={20}
              className="inset-0 text-[--vscode-sideBarTitle-foreground] transition-transform opacity-[0.8]"
            />
            <Folder
              size={20}
              className="inset-0 text-[--vscode-sideBarTitle-foreground] transition-transform opacity-[0.8]"
            />
            <span className="inset-0 text-sm text-[--vscode-sideBarTitle-foreground] transition-transform opacity-[0.8]">
              {element?.name}
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => handleDeleteNode(element)}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <div
        ref={inputRef}
        style={{
          paddingLeft: 40 * (level - 1),
        }}
        className={cn(
          state?.selectedIds?.has(element.id) && isNodeCreating
            ? "flex gap-1 items-center"
            : "hidden",
          "h-7 w-full bg-transparent pt-1"
        )}
      >
        {nodeType == "folder" ? (
          <div className="flex gap-1 items-center">
            <Chevron
              size={20}
              className="inset-0 text-[--vscode-sideBarTitle-foreground] transition-transform opacity-[0.8]"
            />
            <Folder
              size={20}
              className="inset-0 text-[--vscode-sideBarTitle-foreground] transition-transform opacity-[0.8]"
            />
          </div>
        ) : (
          <div className="h-4 w-4">{parse(getIcon(nodeName).svg)}</div>
        )}

        <input
          type="text"
          name="file-name"
          id="fileName"
          onChange={handleChange}
          onKeyDown={handleKeyPress}
          className={cn(
            "h-full w-full outline-none inset-0 text-sm text-[--vscode-sideBarTitle-foreground] rounded-sm",
            isInputError
              ? " border border-[--vscode-inputValidation-errorBorder]"
              : "border border-[--vscode-statusBar-focusBorder]"
          )}
        />
      </div>
      <div
        style={{
          marginLeft: 59 * (level - 1),
        }}
        className={cn(
          state?.selectedIds?.has(element.id) && isInputError
            ? "flex"
            : "hidden",
          "p-2 absolute z-[999999] bg-[--vscode-inputValidation-errorBackground]",
          isInputError
            ? " border border-[--vscode-inputValidation-errorBorder]"
            : "border-none"
        )}
      >
        A file or folder
        {nodeName}
        already exists at this location. Please chose a different name.
      </div>
      <NodeGroup
        data={data}
        element={element}
        state={state}
        dispatch={dispatch}
        expandedIds={expandedIds}
        level={level}
      />
    </li>
  ) : (
    <li
      role="none"
      className={cn(element?.name === ".DS_Store" ? "hidden" : "list-item")}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            style={{
              paddingLeft: 20 * (level - 1),
            }}
            onClick={onClick}
            className={cn(
              state?.selectedIds?.has(element.id)
                ? "bg-[--vscode-list-inactiveSelectionBackground]"
                : "",
              state?.tabSelectedId === element.id
                ? "bg-[--vscode-toolbar-hoverBackground]"
                : "",
              "h-7 w-full flex gap-1 items-center hover:bg-[--vscode-toolbar-hoverBackground] hover:cursor-pointer"
            )}
          >
            {element?.type == "folder" ? (
              <div className="flex gap-1 items-center">
                <Chevron
                  size={20}
                  className="inset-0 text-[--vscode-sideBarTitle-foreground] transition-transform opacity-[0.8]"
                />
                <Folder
                  size={20}
                  className="inset-0 text-[--vscode-sideBarTitle-foreground] transition-transform opacity-[0.8]"
                />
              </div>
            ) : (
              <div className="h-4 w-4">{parse(getIcon(element?.name).svg)}</div>
            )}

            <span className="inset-0 text-sm text-[--vscode-sideBarTitle-foreground] transition-transform opacity-[0.8]">
              {element?.name}
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => handleDeleteNode(element)}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </li>
  );
};

interface INodeGroupProps {
  data: TreeNode[];
  element: TreeNode;
  state: {
    treeData: TreeNode[];
    expandedIds: Set<number>;
    halfSelectedIds: Set<number>;
    selectedIds: Set<number>;
    tabSelectedId: number | null;
    isFocused: boolean;
  };
  dispatch: Dispatch<any>;
  expandedIds: Set<number>;
  level: number;
}

const NodeGroup = ({
  data,
  element,
  expandedIds,
  state,
  dispatch,
  level,
}: INodeGroupProps) => {
  return (
    <ul role="group" className="relative">
      {expandedIds.has(element.id) &&
        element.children.length > 0 &&
        element.children.map((id: number, index: number) => (
          <Node
            key={index}
            data={data}
            element={getTreeNode(data, id)}
            state={state}
            dispatch={dispatch}
            expandedIds={expandedIds}
            level={level + 1}
          />
        ))}
      <div
        className="absolute border-l border-[--vscode-editorIndentGuide-background1] top-0"
        style={{
          height: "100%",
          left: 20 * (level - 0.6),
          display: level == 1 ? "none" : "block",
        }}
      ></div>
    </ul>
  );
};

export default Node;
