// Third party imports
import { Terminal as XtermTerminal } from "@xterm/xterm";

// Local imports
import exit from "./exit";
import { TermColors } from "../constants";
import { colorize, getSpacing } from "../utils";

// Define an interface for a single command object
interface Command {
  id: string;
  args?: number; // Optional number of arguments
  exec: (
    term: XtermTerminal,
    args: any,
    onProcessExit: () => void
  ) => Promise<void>;
  description?: string;
}

const SystemCommands: Command[] = [
  exit,
  {
    id: "help",
    args: 0,
    async exec(term: XtermTerminal) {
      term.writeln("available commands:");
      // Add 3 tabs for spacing. Align each description to the first command description
      const firstCommandSpacing = SystemCommands[0].id.length + 12;
      for (const { id, description } of SystemCommands) {
        if (id === "help") continue;

        term.writeln(
          "\t" +
            colorize(TermColors.Green, id) +
            getSpacing(firstCommandSpacing - id.length) +
            description
        );
      }
    },
  },
];

/**
 * @returns {string|null} Process ID if command executed started a process
 * */
export async function exec(
  term: XtermTerminal,
  userInput: string,
  onProcessExit: () => void
) {
  // Handle arguments check here to avoid duplication
  const [input, ...args] = userInput.split(/\s+/);
  const command = SystemCommands.find((c: any) => c.id === input);
  if (!command) {
    throw new Error(`\x1b[37m jsh: command not found: ${userInput}`);
  }

  if (command.args === 0 && args.length > 0) {
    throw new Error(`${command.id} does not accept arguments`);
  }

  if (
    (command.args === -1 && args.length === 0) ||
    (command.args !== -1 && command.args !== args.length)
  ) {
    throw new Error(
      "not enough arguments\r\n" +
        colorize(TermColors.Reset, `usage: ${command.id}`)
    );
  }

  await command.exec(term, args, onProcessExit);
  return null;
}
