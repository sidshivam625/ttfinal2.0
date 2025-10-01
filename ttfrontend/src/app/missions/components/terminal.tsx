"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface Line {
  id: string;
  text: string;
  kind?: "stdout" | "stderr" | "system";
}

function uid() {
  return Math.random().toString(36).slice(2);
}

const PROMPT = "root@classified:~#";

interface TerminalProps {
  className?: string;
  style?: React.CSSProperties;
  onSubmit: (flag: string) => Promise<{ success: boolean; message: string }>;
}

export default function Terminal({
  className = "",
  style,
  onSubmit,
}: TerminalProps) {
  const [lines, setLines] = useState<Line[]>([
    { id: uid(), text: "Enter flag sequence... (type 'help' for commands)", kind: "stdout" },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, pending]);

  const push = useCallback((text: string, kind: Line["kind"] = "stdout") => {
    setLines((l) => [...l, { id: uid(), text, kind }]);
  }, []);

  const handleCommand = useCallback(
    async (command: string) => {
      const parts = command.trim().split(" ");
      const cmd = parts[0].toLowerCase();

      switch (cmd) {
        case "help":
          push("Available commands:", "system");
          push("  help         Show available commands", "system");
          push("  clear        Clear the terminal", "system");
          push("  flag <text>  Submit a flag for validation", "system");
          break;

        case "clear":
          setLines([]);
          break;

        case "flag": {
          const flag = parts.slice(1).join(" ").trim();
          if (!flag) {
            push("❌ Usage: flag <your-flag>", "stderr");
            return;
          }

          push("Transmitting flag…", "system");
          setPending(true);
          try {
            const result = await onSubmit(flag);
            if (result.success) {
              push(`✅ ${result.message}`, "system");
            } else {
              push(`❌ ${result.message}`, "stderr");
            }
          } catch {
                  push("❌ Error communicating with server.", "stderr");
                } finally {
            setPending(false);
          }
          break;
        }

        default:
          push(`❌ Unknown command: ${cmd}`, "stderr");
      }
    },
    [onSubmit, push]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const command = input.trim();
      if (!command) return;

      // Echo user input exactly once (keep this here)
      push(`${PROMPT} ${command}`);

      // Reset input immediately so UX feels snappy
      setInput("");

      // Run the command (no additional echo inside handleCommand)
      await handleCommand(command);
    },
    [input, handleCommand, push]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={"w-full " + className}
      style={style}
    >
      <div
        className="rounded-xl border border-[#2BF58D] shadow-[0_0_4px_rgba(0,255,0,0.2)] bg-black"
        style={{
          minHeight: "250px",
          maxHeight: "350px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 text-xs tracking-widest uppercase text-emerald-300/90 border-b border-[rgba(43,245,141,0.35)] font-vt323 font-bold">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "#FF6467" }} />
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "#89304E", animationDelay: "0.4s" }} />
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "#522546", animationDelay: "0.8s" }} />
            </div>
            <div>root@classified:~/mission</div>
          </div>
          <div className="text-emerald-300/80">SECURE.LINK</div>
        </div>

        {/* Body */}
        <div
            ref={scrollRef}
            className="flex-1 overflow-auto p-4 font-vt323 text-[15px] leading-relaxed"
          >
          {lines.map((l) => (
            <div
              key={l.id}
              className={
                  l.kind === "stderr" ? "text-red-400" : l.kind === "system" ? "text-emerald-300/80" : "text-emerald-300"
                }
            >
              {l.text}
            </div>
          ))}

          {/* Input line */}
          <div className="flex items-center text-emerald-300 mt-2">
            <span className="select-none mr-2">{PROMPT}</span>
            <input
              name="command"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={pending}
              className="flex-1 b   g-transparent outline-none caret-emerald-400 placeholder:text-emerald-400/40 text-emerald-200"
              placeholder="Type a command..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[rgba(43,245,141,0.35)] text-xs text-emerald-300/80 font-vt323 font-bold">
          <div className="space-x-4">
            <span>ENTER=EXECUTE</span>
            <span>&quot;help&quot;=COMMANDS</span>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="px-3 py-1 bg-emerald-400 text-black font-bold rounded"
          >
            {pending ? "Running..." : "Submit"}
          </button>
        </div>
  </div>
    </form>
  );
}
