import { sleep } from "../utils";
import { Terminal as XtermTerminal } from "@xterm/xterm";

export async function exec(term: XtermTerminal, _args: any) {
  term.writeln("terminating session...");
  await sleep(1000);
}

const exit = {
  id: "exit",
  args: 0,
  description: "terminate current session",
  exec,
};

export default exit;
