import { useReducer } from "react";
import { treeReducer } from "./reducer";

export const useTree = () => {
  const [state, dispatch] = useReducer(treeReducer, {
    treeData: [],
    expandedIds: new Set<number>(),
    halfSelectedIds: new Set<number>(),
    selectedIds: new Set<number>(),
    tabSelectedId: 0,
    isFocused: false,
  });

  // The "as const" technique tells Typescript that this is a tuple not an array
  return [state, dispatch] as const;
};
