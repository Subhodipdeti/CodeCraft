"use client";
// Third party imports
import { ElementRef, useEffect, useRef } from "react";
import { WebContainer } from "@webcontainer/api";
import { useWindowSize } from "usehooks-ts";
import { Terminal as XtermTerminal } from "@xterm/xterm";

// Local imports
import ActivityBar from "@/components/activitybar/activity-bar";
import Editor from "@/components/editor/editor";
import Footer from "@/components/footer";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar/sidebar";
import { cn } from "@/lib/utils";
import { useActivityBarStore } from "@/stores/activity-bar-store";
import fileManagerUtils from "../../lib/fileManager";
import emitter, { MessageType } from "../../hooks/events";
import { SHELL_PROMPT } from "@/components/terminal/constants";
import { sleep } from "@/components/terminal/utils";
import { createOnKeyHandler } from "@/components/terminal/terminal";
import { StorageUtils } from "@/lib/storage";
import { EventConstant, StorageConstant } from "@/constants";

let webContainer: WebContainer;
type Directory = { [key: string]: any };

function findPackageJson(dir: Directory, path: string = ""): string | null {
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

function getDirectoryByPath(dir: Directory, path: string): Directory | null {
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

const term = new XtermTerminal({
  cursorBlink: true,
  scrollback: 1000,
  tabStopWidth: 4,
  theme: {
    background: "#181818",
    green: "#2ab025",
    brightGreen: "#2ab025",
    yellow: "#f2ca29",
    brightYellow: "#f2ca29",
    red: "#cf442b",
    brightRed: "#cf442b",
  },
});

async function installDependencies() {
  // Install dependencies
  const installProcess = await webContainer.spawn("npm", ["install"]);

  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        term.write(data);
        term.scrollToBottom();
      },
    })
  );
  // Wait for install command to exit
  return installProcess.exit;
}

async function startDevServer() {
  const iframeEl = document.querySelector("iframe");
  // Run `npm run start` to start the Express app
  const installProcess = await webContainer.spawn("npm", ["start"]);

  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        term.write(data);
        term.scrollToBottom();
      },
    })
  );

  // Wait for `server-ready` event
  webContainer.on("server-ready", (_, url) => {
    if (iframeEl) {
      iframeEl.src = url;
    }
  });
}

var excludePath = "";

const getSnapshot = async () => {
  webContainer = await WebContainer.boot();

  const filesDirectory = StorageUtils.getFromStorage(
    StorageConstant.FILE_TREE_KEY
  );

  const resultPath = findPackageJson(filesDirectory);
  if (resultPath) {
    const directory = getDirectoryByPath(filesDirectory, resultPath);
    excludePath = resultPath.split("/")[0];

    if (directory) {
      await webContainer.mount(directory);

      const exitCode = await installDependencies();
      if (exitCode !== 0) {
        throw new Error("Installation failed");
      }

      startDevServer();
    }
  }
};

async function initTerminalSession(term: XtermTerminal) {
  await sleep(1300);
  term.write(SHELL_PROMPT);
}

initTerminalSession(term);

term.onKey(createOnKeyHandler(term));

export default function Home() {
  const isResizingRef = useRef(false);
  const sidebarRef = useRef<ElementRef<"div">>(null);
  const containerRef = useRef<ElementRef<"div">>(null);

  const { isSidebarOpen } = useActivityBarStore((state) => state);

  const { width } = useWindowSize();
  const maxSidebarWidth = width / 2;

  const handelMouseMove = (event: MouseEvent) => {
    if (!isResizingRef.current) return;
    let newWidth = event.clientX;
    if (newWidth < 266) newWidth = 266;
    if (newWidth > maxSidebarWidth) newWidth = maxSidebarWidth;

    if (sidebarRef.current && containerRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`;
      containerRef.current.style.setProperty("left", `${newWidth}px`);
      containerRef.current.style.setProperty(
        "width",
        `calc(100% - ${newWidth}px)`
      );
    }
  };

  const handelMouseUp = () => {
    isResizingRef.current = false;
    document.removeEventListener("mousemove", handelMouseMove);
    document.removeEventListener("mouseup", handelMouseUp);
  };

  const handelMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    isResizingRef.current = true;
    document.addEventListener("mousemove", handelMouseMove);
    document.addEventListener("mouseup", handelMouseUp);
  };

  function removeSubstring(str: string, substring: string) {
    // Create a regular expression with the substring and global flag
    const regex = new RegExp(substring, "g");
    return str.replace(regex, "");
  }

  const onChangeValue = async (content: string | undefined, path: string) => {
    try {
      if (content) {
        await fileManagerUtils.writeToFile(
          webContainer,
          content,
          removeSubstring(path, excludePath)
        );
      }
    } catch (error) {
      console.log(error || "Save content to file failed!");
    }
  };

  async function installCustomDependencies(packageName: string) {
    // Install dependencies
    const installProcess = await webContainer.spawn("npm", [
      "install",
      packageName,
    ]);
    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          term.write(data);
        },
      })
    );
    // Wait for install command to exit
    return installProcess.exit;
  }

  const onHandelInstallDependencies = async (packageName: string) => {
    const exitCode = await installCustomDependencies(packageName);
    if (exitCode !== 0) {
      throw new Error("Installation failed");
    }
  };

  useEffect(() => {
    const handleEvent = (message: MessageType) => {
      if (message.type === EventConstant.Event["install-packages"]) {
        getSnapshot();
      }

      if (message.type === EventConstant.Event["custom-install-packages"]) {
        onHandelInstallDependencies(message.data?.packageName);
      }
    };
    emitter.on("message", handleEvent);

    return () => {
      emitter.off("message", handleEvent);
    };
  }, []);

  return (
    <div className="h-full w-full">
      {/* Here will be Header */}
      <div className="fixed w-full">
        <Header />
      </div>

      {/* Sidebar Will Be Here */}
      <div className="h-[calc(100%-72px)] flex mt-[48px] w-[72px] z-30 flex-col fixed inset-y-0">
        <ActivityBar />
      </div>

      <main className="h-[calc(100%-72px)] w-full pl-[64px] mt-[48px] fixed flex">
        {/* Extended Sidebar Will Be Here */}

        <Sidebar
          ref={sidebarRef}
          isSidebarOpen={isSidebarOpen}
          onHandelMouseDown={handelMouseDown}
        />

        {/* Monaco Editor Will Be Here */}
        <div
          ref={containerRef}
          className={cn(
            "flex items-center justify-center",
            isSidebarOpen ? "w-[calc(100%-266px)]" : "w-full"
          )}
        >
          <div className="h-full w-1/2">
            <Editor term={term} onChange={onChangeValue} />
          </div>
          <div className="h-full w-1/2">
            <iframe src="" style={{ height: "100%", width: "100%" }}></iframe>
          </div>
        </div>
      </main>

      {/* Footer will be here */}
      <Footer />
    </div>
  );
}
