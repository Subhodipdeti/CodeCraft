import { getTreeNode, getTreeParent } from "@/lib/utils";
import { TreeNode } from "./tree";

export interface TreeState {
  treeData: TreeNode[];
  expandedIds: Set<number>;
  halfSelectedIds: Set<number>;
  selectedIds: Set<number>;
  tabSelectedId: number;
  isFocused: boolean;
}

export type ActionType =
  | "expand"
  | "toggle"
  | "select"
  | "toggleSelect"
  | "focus"
  | "collapse"
  | "add_node"
  | "delete_node"
  | "update_node";

export interface Action {
  type: ActionType;
  id: number;
  lastInteractedWith?: number;
  newNode?: TreeNode;
  nodeId?: number;
  newData?: Partial<TreeNode>;
}

export const treeReducer = (state: TreeState, action: Action) => {
  switch (action.type) {
    case "expand": {
      const expandedIds = new Set<number>(state.expandedIds);
      expandedIds.add(action.id);
      return {
        ...state,
        expandedIds,
      };
    }

    case "toggle": {
      const expandedIds = new Set<number>(state.expandedIds);
      if (state.expandedIds.has(action.id)) expandedIds.delete(action.id);
      else expandedIds.add(action.id);
      return {
        ...state,
        expandedIds,
      };
    }

    case "select": {
      const halfSelectedIds = new Set<number>(state.halfSelectedIds);
      halfSelectedIds.delete(action.id);
      return {
        ...state,
        halfSelectedIds,
      };
    }

    case "toggleSelect": {
      let selectedIds = state?.selectedIds;
      const isSelected = state?.selectedIds?.has(action.id);
      if (!isSelected) {
        selectedIds = new Set<number>();
        selectedIds.add(action.id);
      }

      return {
        ...state,
        selectedIds,
      };
    }

    case "focus": {
      return {
        ...state,
        tabSelectedId: action.id,
        isFocused: true,
      };
    }

    case "collapse": {
      const expandedIds = new Set<number>(state.expandedIds);
      expandedIds.delete(action.id);
      return {
        ...state,
        expandedIds,
        tabSelectedId: action.id,
      };
    }

    case "add_node": {
      const { newNode } = action;
      const updatedTreeData = [...state?.treeData];

      if (newNode?.parent) {
        const parentNode = getTreeNode(updatedTreeData, newNode.parent);
        if (!parentNode.children.includes(newNode?.id)) {
          parentNode.children.push(newNode?.id);
        }
      }
      if (newNode?.id) {
        getTreeParent(updatedTreeData).children.push(newNode?.id);
      }

      if (newNode) {
        updatedTreeData.push(newNode);
      }

      return {
        ...state,
        treeData: updatedTreeData,
      };
    }

    case "delete_node": {
      const { nodeId } = action;
      const updatedTreeData = [...state?.treeData];

      // Remove the node from treeData
      const nodeIndex = updatedTreeData.findIndex((node) => node.id === nodeId);
      if (nodeIndex === -1) {
        return state; // Node not found, return state unchanged
      }
      const nodeToDelete = updatedTreeData.splice(nodeIndex, 1)[0];

      // If the node has a parent, remove the node from its parent's children
      if (nodeToDelete.parent) {
        const parentNode = getTreeNode(updatedTreeData, nodeToDelete.parent);
        parentNode.children = parentNode.children.filter(
          (childId: number) => childId !== nodeId
        );
      }

      // Remove the node ID from expandedIds, halfSelectedIds, and selectedIds
      const expandedIds = new Set(state.expandedIds);
      if (nodeId) expandedIds.delete(nodeId);

      const halfSelectedIds = new Set(state.halfSelectedIds);
      if (nodeId) halfSelectedIds.delete(nodeId);

      const selectedIds = new Set(state.selectedIds);
      if (nodeId) selectedIds.delete(nodeId);

      return {
        ...state,
        treeData: updatedTreeData,
        expandedIds,
        halfSelectedIds,
        selectedIds,
      };
    }

    case "update_node": {
      const { nodeId, newData } = action;
      const updatedTreeData = state.treeData.map((node: TreeNode) => {
        if (node.id === nodeId) {
          return { ...node, ...newData };
        }
        return node;
      });

      return {
        ...state,
        treeData: updatedTreeData,
      };
    }

    default:
      throw new Error("Invalid action passed to the reducer");
  }
};
