// Local imports
import { StorageUtils } from "@/lib/storage";
import { HistorySize, TermColors } from "../constants";
import { StorageConstant } from "@/constants";

type Directory = { [key: string]: any };

export function sleep(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export function colorize(color: string, text: string) {
  return `${color}${text}${TermColors.Reset}`;
}

export function getSpacing(spacing: number, spacer = " ") {
  const ret = [];
  let i = spacing;

  while (i > 0) {
    ret.push(spacer);
    i -= 1;
  }
  return ret.join("");
}

export function handleBackspace(term: any, input: string) {
  if (input.length === 0) return input;

  if (term._core.buffer.x === 0 && term._core.buffer.y > 1) {
    // Move up
    term.write("\x1b[A");
    // Move to the end
    term.write("\x1b[" + term._core.buffer._cols + "G");
    term.write(" ");
  } else {
    term.write("\b \b");
  }
  return input.substring(0, input.length - 1);
}

export function isPrintableKeyCode(keyCode: number) {
  return (
    keyCode === 32 ||
    (keyCode >= 48 && keyCode <= 90) ||
    (keyCode >= 96 && keyCode <= 111) ||
    (keyCode >= 186 && keyCode <= 222)
  );
}

export function findPackageJson(
  dir: Directory,
  path: string = ""
): string | null {
  for (const key in dir) {
    const currentPath = path ? `${path}/${key}` : key;

    if (key === "package.json") {
      return path || "/";
    }

    if (typeof dir[key] === "object" && dir[key] !== null) {
      const result = findPackageJson(dir[key], currentPath);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

export function getDirectoryByPath(
  dir: Directory,
  path: string
): Directory | null {
  const parts = path.split("/").filter(Boolean);
  let current = dir;

  for (const part of parts) {
    if (current[part] && typeof current[part] === "object") {
      current = current[part];
    } else {
      return null;
    }
  }

  return current;
}

export function readFromPackageJson() {
  const filesDirectory = StorageUtils.getFromStorage(
    StorageConstant.FILE_TREE_KEY
  );
  if (!filesDirectory) {
    return "";
  }

  const resultPath: string | null = findPackageJson(filesDirectory);
  if (resultPath) {
    const directory: Directory | null = getDirectoryByPath(
      filesDirectory,
      resultPath
    );
    return JSON.parse(directory?.["package.json"]?.file?.contents);
  }
}

export function pushCommandToHistory(store: string[], command: string) {
  // Avoid duplicates with last command
  if (store.length > 0 && store[store.length - 1] === command) {
    return;
  }
  store.push(command);
  if (store.length > HistorySize) {
    store.shift();
  }

  setTimeout(
    () => StorageUtils.setInStorage(StorageConstant.FILE_TREE_HISTORY, store),
    0
  );
}

export function loadCommandHistory() {
  const data = StorageUtils.getFromStorage(StorageConstant.FILE_TREE_HISTORY);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse command history", e);
    return [];
  }
}
