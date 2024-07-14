import { create } from "zustand";

interface ActivityBarState {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
}

export const useActivityBarStore = create<ActivityBarState>((set) => ({
  isSidebarOpen: false,
  openSidebar: () => set(() => ({ isSidebarOpen: true })),
  closeSidebar: () => set(() => ({ isSidebarOpen: false })),
}));
