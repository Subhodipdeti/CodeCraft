import { WebContainer } from "@webcontainer/api";

function checkRecursive(path: string) {
  const segments = path.split("/");
  return segments.length > 0;
}

const createFile = (wci: WebContainer, path: string) => {
  return wci.fs.mkdir(path, { recursive: checkRecursive(path) as any });
};

const renameFile = (wci: WebContainer, oldPath: string, newPath: string) => {
  return wci.fs.rename(oldPath, newPath);
};

const deleteFile = (wci: WebContainer, path: string) => {
  return wci.fs.rm(path, {
    recursive: checkRecursive(path),
  });
};

const writeToFile = (wci: WebContainer, content: string, path: string) => {
  return wci.fs.writeFile(`/${path}`, content);
};

export default {
  createFile,
  renameFile,
  deleteFile,
  writeToFile,
};
