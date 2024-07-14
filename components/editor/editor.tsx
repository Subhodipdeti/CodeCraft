"use client";
// Third party imports
import { useEffect, useRef, useState } from "react";
import { Terminal as XtermTerminal } from "@xterm/xterm";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import "@xterm/xterm/css/xterm.css";

// Local imports
import { useEditorStore } from "@/stores";
import Terminal from "@/components/terminal";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const someJSCodeExample = ``;

interface EditorProps {
  term: XtermTerminal;
  onChange: (value: string | undefined, path: string) => void;
}

const Editor = ({ term, onChange }: EditorProps) => {
  const editorRef = useRef<any>(null);
  const [fileName, setFileName] = useState("");

  const { name, language, template, path } = useEditorStore((state) => state);

  useEffect(() => {
    if (path) {
      setFileName(name);
      editorRef.current?.focus();
    }
  }, [path]);

  return (
    <ResizablePanelGroup
      direction="vertical"
      className="h-full w-full flex flex-col"
    >
      {fileName ? (
        <ResizablePanel>
          <MonacoEditor
            theme="vs-dark"
            path={fileName}
            language={language || "javascript"}
            defaultValue={template || someJSCodeExample}
            onMount={(editor) => (editorRef.current = editor)}
            onChange={(value) => onChange(value, path)}
          />
        </ResizablePanel>
      ) : null}

      <ResizableHandle />

      {fileName ? (
        <ResizablePanel defaultSize={30}>
          <Terminal term={term} />
        </ResizablePanel>
      ) : null}
    </ResizablePanelGroup>
  );
};

export default Editor;
