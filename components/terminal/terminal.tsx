"use client";
// Third party imports
import { Terminal as XtermTerminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";

// Local imports
import { EventConstant, KeyboardConstant } from "@/constants";
import emitter from "../../hooks/events";
import { exec as exit } from "./commands/exit";
import { exec } from "./commands/index";
import { SHELL_PROMPT, TermColors } from "./constants";
import {
  handleBackspace,
  isPrintableKeyCode,
  loadCommandHistory,
  pushCommandToHistory,
  readFromPackageJson,
} from "./utils";

interface KeyHandler {
  key: string;
  domEvent: KeyboardEvent;
}

interface TerminalProps {
  term: XtermTerminal;
}

function printError(term: XtermTerminal, error: string) {
  term.write(TermColors.Red + error);
}

function prompt(term: XtermTerminal) {
  term.write("\r\n" + SHELL_PROMPT);
}

function deleteCurrentInput(term: XtermTerminal, input: string) {
  let i = 0;
  while (i < input.length) {
    term.write("\b \b");
    i++;
  }
}

export function createOnKeyHandler(term: XtermTerminal) {
  // Track the user input
  let userInput = "";
  // Track command history
  let commandHistory = loadCommandHistory();
  let currentHistoryPosition = commandHistory.length;
  // Only one process at a time
  let currentProcessId: null = null;

  function onProcessExit() {
    prompt(term);
    currentProcessId = null;
  }

  return async ({ key, domEvent: ev }: KeyHandler) => {
    if (currentProcessId !== null) {
      return;
    }

    switch (ev.key) {
      case KeyboardConstant.KeyboardEvent.ArrowUp:
      case KeyboardConstant.KeyboardEvent.ArrowDown: {
        if (commandHistory.length === 0) {
          return;
        }

        if (ev.key === KeyboardConstant.KeyboardEvent.ArrowDown) {
          if (currentHistoryPosition === commandHistory.length) return;

          currentHistoryPosition = Math.min(
            commandHistory.length,
            currentHistoryPosition + 1
          );
        } else {
          currentHistoryPosition = Math.max(0, currentHistoryPosition - 1);
        }

        deleteCurrentInput(term, userInput);
        if (currentHistoryPosition === commandHistory.length) {
          userInput = "";
        } else {
          userInput = commandHistory[currentHistoryPosition];
        }
        term.write(userInput);
        return;
      }

      case KeyboardConstant.KeyboardEvent.c: {
        if (ev.ctrlKey) {
          prompt(term);
          userInput = "";
          currentHistoryPosition = commandHistory.length;
          return;
        }
        break;
      }

      case KeyboardConstant.KeyboardEvent.l: {
        if (ev.ctrlKey) {
          term.clear();
          return;
        }
        break;
      }

      case KeyboardConstant.KeyboardEvent.d: {
        if (ev.ctrlKey) {
          await exit(term, {});
          return;
        }
        break;
      }

      case KeyboardConstant.KeyboardEvent.Backspace: {
        userInput = handleBackspace(term, userInput);
        return;
      }

      case KeyboardConstant.KeyboardEvent.Enter: {
        userInput = userInput.trim();
        if (userInput.length === 0) {
          userInput = "";
          prompt(term);
          return;
        }

        term.writeln("");

        const data = readFromPackageJson();
        if (!data) {
          term.writeln("Please open a project first");
          prompt(term);
          return;
        }

        if (
          userInput.split(" ")[0] === "npm" &&
          data?.scripts.hasOwnProperty(userInput.split(" ")[1])
        ) {
          emitter.emit("message", {
            type: EventConstant.Event["install-packages"],
            data: {},
          });
          return;
        }

        if (userInput.includes("npm install")) {
          emitter.emit("message", {
            type: EventConstant.Event["custom-install-packages"],
            data: {
              packageName: userInput.split(" ")?.[2],
            },
          });
          return;
        }

        try {
          currentProcessId = await exec(term, userInput, onProcessExit);
        } catch (e) {
          if (e instanceof Error) {
            printError(term, e.message);
          }
        }

        pushCommandToHistory(commandHistory, userInput);
        currentHistoryPosition = commandHistory.length;

        userInput = "";
        if (currentProcessId === null) {
          prompt(term);
        }
        return;
      }
    }

    const hasModifier = ev.altKey || ev.ctrlKey || ev.metaKey;

    if (!hasModifier && isPrintableKeyCode(ev.keyCode)) {
      term.write(key);
      userInput += key;
    }
  };
}

const Terminal = ({ term }: TerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  const initTerminal = async () => {
    if (terminalRef.current) {
      term.open(terminalRef.current);
      term.focus();
    }
  };

  useEffect(() => {
    initTerminal();
  }, []);

  return (
    <div
      ref={terminalRef}
      className="border-t border-r border-[--vscode-panel-border] bg-[--vscode-panel-background] p-2 h-52 overflow-y-scroll"
    />
  );
};

export default Terminal;
