import { create } from "zustand";

type FileType = "file" | "folder";

export interface FileData {
  id: number;
  name: string;
  type: FileType;
  size?: number;
  modifiedAt?: Date;
}

interface FileExplorerStore {
  files: FileData[];
  setFiles: (filesData: FileData[]) => void;
}

export const useFileExplorerStore = create<FileExplorerStore>((set) => ({
  files: [],
  setFiles: (filesData) => set(() => ({ files: filesData })),
}));
