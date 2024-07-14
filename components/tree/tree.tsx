"use client";
// Third party imports
import React, { useReducer } from "react";

// Local imports
import {
  getNextAccessible,
  getParent,
  getPreviousAccessible,
  getTreeNode,
  getTreeParent,
  isBranchNode,
} from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { treeReducer } from "./reducer";
import Node from "./components/node";
import { KeyboardConstant } from "../../constants";

type FileType = "file" | "folder";

export interface TreeNode {
  id: number;
  label: string;
  name: string;
  children: number[];
  type: FileType;
  path: string;
  template: string;
  isBranch?: boolean;
  parent?: number;
}

function swapChildrenIds(array: TreeNode[]): TreeNode[] {
  // Create a map to easily access objects by their IDs
  const idMap: Record<number, TreeNode> = {};
  array.forEach((obj) => {
    idMap[obj.id] = obj;
  });

  // Iterate over each object in the array
  array.forEach((obj) => {
    // Check if the object has children
    if (
      obj.parent !== undefined &&
      obj.parent !== null &&
      obj.children &&
      obj.children.length > 0
    ) {
      // Find the parent object
      const parentObj = idMap[obj.parent as number];

      // Swap children IDs if necessary
      if (parentObj && parentObj.children && parentObj.children.length > 0) {
        const parentChildren = parentObj.children as unknown as number[];

        // Move children to the first position
        const index = parentChildren.indexOf(obj.id);
        if (index !== -1) {
          parentChildren.splice(index, 1);
        }

        parentChildren.unshift(obj.id);
        // Update parentObj.children in idMap
        (parentObj.children as unknown) = parentChildren;
      }
    }
  });

  return array;
}

interface TreeProps {
  treeData: TreeNode[];
}

const Tree = ({ treeData: td }: TreeProps) => {
  const [state, dispatch] = useReducer(treeReducer, {
    treeData: swapChildrenIds(td),
    expandedIds: new Set<number>(),
    halfSelectedIds: new Set<number>(),
    selectedIds: new Set<number>(),
    tabSelectedId: 0,
    isFocused: false,
  });

  const handelKeyDown = (event: React.KeyboardEvent) => {
    const sampleTreeData = state.treeData;
    const expandedIds = state.expandedIds;
    const tabSelectedId = state.tabSelectedId;
    const element = getTreeNode(sampleTreeData, state.tabSelectedId);
    const id = element.id;

    switch (event.key) {
      case KeyboardConstant.KeyboardEvent.ArrowUp: {
        event.preventDefault();
        const previous = getPreviousAccessible(
          sampleTreeData,
          id,
          state.expandedIds
        );
        if (previous != null) {
          dispatch({
            type: "focus",
            id: previous,
          });
        }
        return;
      }

      case KeyboardConstant.KeyboardEvent.ArrowDown: {
        event.preventDefault();
        const next = getNextAccessible(sampleTreeData, id, expandedIds);
        if (next != null) {
          dispatch({
            type: "focus",
            id: next,
          });
        }
        return;
      }

      case KeyboardConstant.KeyboardEvent.ArrowLeft: {
        event.preventDefault();
        if (
          (isBranchNode(sampleTreeData, id) || element.isBranch) &&
          expandedIds.has(tabSelectedId)
        ) {
          dispatch({
            type: "collapse",
            id,
            lastInteractedWith: id,
          });
        } else {
          const isRoot = getTreeParent(sampleTreeData).children.includes(id);
          if (!isRoot) {
            const parentId = getParent(sampleTreeData, id);
            if (parentId == null) {
              throw new Error("parentId of root element is null");
            }
            dispatch({
              type: "focus",
              id: parentId,
              lastInteractedWith: parentId,
            });
          }
        }
        return;
      }

      case KeyboardConstant.KeyboardEvent.ArrowRight: {
        event.preventDefault();
        if (isBranchNode(sampleTreeData, id)) {
          if (expandedIds.has(tabSelectedId)) {
            dispatch({
              type: "focus",
              id: element.children[0],
            });
          } else {
            dispatch({ type: "expand", id });
          }
        }
        return;
      }

      default:
        break;
    }
  };

  return (
    <div>
      <ScrollArea className="h-[calc(100%-40px)] relative flex flex-col gap-1">
        <ul
          onKeyDown={handelKeyDown}
          role="tree"
          className="h-full w-full flex flex-col gap-1 select-none"
        >
          {getTreeParent(state.treeData).children.map(
            (id: number, index: number) => (
              <Node
                key={index}
                state={state}
                dispatch={dispatch}
                data={state?.treeData}
                element={getTreeNode(state.treeData, id)}
                expandedIds={state.expandedIds}
                level={1}
              />
            )
          )}
        </ul>
      </ScrollArea>
    </div>
  );
};

export default Tree;
