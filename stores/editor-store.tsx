import { create } from "zustand";

interface EditorState {
  id: number;
  name: string;
  template: string;
  language: string;
  path: string;
  setCurrentFilePath: (file: FileType) => void;
}

type FileType = {
  id: number;
  name: string;
  template: string;
  language: string;
  path: string;
};

export const useEditorStore = create<EditorState>((set) => ({
  id: 0,
  name: "",
  template: "",
  language: "",
  path: "",
  setCurrentFilePath: (file: FileType) =>
    set(() => ({
      id: file.id,
      name: file.name,
      language: file.language,
      path: file.path,
      template: file.template,
    })),
}));
