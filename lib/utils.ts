import { TreeNode } from "@/components/tree/tree";
import { EventCallback } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getTreeParent = (data: TreeNode[]): TreeNode => {
  const parentNode = data.find((node) => node.parent === null);

  if (!parentNode) {
    throw Error("TreeView data must contain parent node.");
  }

  return parentNode;
};

export const getTreeNode = (data: TreeNode[], id: number): TreeNode => {
  const treeNode = data.find((node: TreeNode) => node.id === id);

  if (treeNode == null) {
    throw Error(`Node with id=${id} doesn't exist in the tree.`);
  }

  return treeNode;
};

export const isBranchNode = (data: TreeNode[], id: number) => {
  const node = getTreeNode(data, id);
  return !!node.children?.length;
};

export const getChildren = (data: TreeNode[], id: number) => {
  const children: number[] = [];
  const node = getTreeNode(data, id);
  return node.children == null ? children : node.children;
};

export const isBranchSelectedAndHasOnlySelectedChild = (
  data: TreeNode[],
  elementId: number,
  selectedIds: Set<number>
) => {
  const nodeChildren = getChildren(data, elementId);
  return (
    isBranchNode(data, elementId) &&
    selectedIds.has(elementId) &&
    nodeChildren.length === 1 &&
    nodeChildren.every((item: number) => selectedIds.has(item))
  );
};

export const getDescendants = (
  data: TreeNode[],
  id: number,
  disabledIds: Set<number>
) => {
  const descendants: number[] = [];
  const getDescendantsHelper = (data: TreeNode[], id: number) => {
    const node = getTreeNode(data, id);
    if (node.children == null) return;
    for (const childId of node.children.filter(
      (x: number) => !disabledIds.has(x)
    )) {
      descendants.push(childId);
      getDescendantsHelper(data, childId);
    }
  };
  getDescendantsHelper(data, id);
  return descendants;
};

export const isBranchSelectedAndHasSelectedDescendants = (
  data: TreeNode[],
  elementId: number,
  selectedIds: Set<number>
) => {
  return (
    isBranchNode(data, elementId) &&
    selectedIds.has(elementId) &&
    getDescendants(data, elementId, new Set<number>()).some((item: number) =>
      selectedIds.has(item)
    )
  );
};

export const isBranchSelectedAndHasAllSelectedEnabledDescendants = (
  data: TreeNode[],
  elementId: number,
  selectedIds: Set<number>,
  disabledIds: Set<number>
) => {
  const children = getDescendants(data, elementId, new Set<number>());
  return (
    isBranchNode(data, elementId) &&
    selectedIds.has(elementId) &&
    children.every((item) => selectedIds.has(item)) &&
    children.every((item) => !disabledIds.has(item))
  );
};

export const composeHandlers =
  (...handlers: EventCallback[]): EventCallback =>
  (event): void => {
    for (const handler of handlers) {
      handler && handler(event);
      if (event.defaultPrevented) {
        break;
      }
    }
  };

export const getParent = (data: TreeNode[], id: number) => {
  return getTreeNode(data, id).parent;
};

export const getSibling = (data: TreeNode[], id: number, diff: number) => {
  const parentId = getParent(data, id);
  if (parentId != null) {
    const parent = getTreeNode(data, parentId);
    const index = parent.children.indexOf(id);
    const siblingIndex = index + diff;
    if (parent.children[siblingIndex]) {
      return parent.children[siblingIndex];
    }
  }
  return null;
};

export const getLastAccessible = (
  data: TreeNode[],
  id: number,
  expandedIds: Set<number>
) => {
  let node = getTreeNode(data, id);
  const isRoot = getTreeParent(data).id === id;
  if (isRoot) {
    node = getTreeNode(
      data,
      getTreeNode(data, id).children[getTreeNode(data, id).children.length - 1]
    );
  }
  while (expandedIds.has(node.id) && isBranchNode(data, node.id)) {
    node = getTreeNode(data, node.children[node.children.length - 1]);
  }
  return node.id;
};

export const getPreviousAccessible = (
  data: TreeNode[],
  id: number,
  expandedIds: Set<number>
) => {
  if (id === getTreeParent(data).children[0]) {
    return null;
  }
  const previous = getSibling(data, id, -1);
  if (previous == null) {
    return getParent(data, id);
  }
  return getLastAccessible(data, previous, expandedIds);
};

export const getNextAccessible = (
  data: TreeNode[],
  id: number,
  expandedIds: Set<number>
) => {
  let nodeId = getTreeNode(data, id).id;
  if (isBranchNode(data, nodeId) && expandedIds.has(nodeId)) {
    return getTreeNode(data, nodeId).children[0];
  }
  while (true) {
    const next = getSibling(data, nodeId, 1);
    if (next != null) {
      return next;
    }
    nodeId = getParent(data, nodeId) as number;

    //we have reached the root so there is no next accessible node
    if (nodeId == null) {
      return null;
    }
  }
};
