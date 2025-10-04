"use client";

import { useMemo, useState } from "react";

export type CellStatus = "active" | "done" | "locked";

interface GridStatusProps {
  total: number;
  columns?: number;
  cellSize: string;
  title?: string;
  initialStatuses?: Record<number, CellStatus>;
  gridWidth?: string;
  gridHeight?: string;
  onCellClick?: (idx: number) => void;
  activeIndex?: number;
}

export default function QuestionGrid({
  total,
  columns = 5,
  cellSize,
  title = "GRID.STATUS",
  initialStatuses = {},
  onCellClick,
  activeIndex,
}: GridStatusProps) {
  // Keep a local status map initialized from props. Parent updates are expected via prop changes.
  const [statusMap] = useState<Record<number, CellStatus>>(initialStatuses);

  const items = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [
    total,
  ]);

  const handleCellClick = (i: number) => {
    const current = statusMap[i] ?? "locked";
    if (current === "locked") return; // ignore click
    if (onCellClick) onCellClick(i - 1); // Pass zero-based index to parent
  };

  const getStatus = (i: number): CellStatus => statusMap[i] ?? "locked";

  return (
    <section
      className="rounded-xl border-2 p-5 sm:p-6 shadow-[0_0_4px_rgba(0,0,0,0.2)] flex flex-col gap-5 w-full max-w-[500px] md:max-w-[600px]"
      style={{ borderColor: "#FF6467", height: "auto" }}
    >
      {/* Title */}
      <header className="flex items-center justify-between">
        <h1
          className="font-vt323 text-base tracking-[0.4em] uppercase"
          style={{
            color: "#fa4d50ff",
            textShadow: "0 0 8px rgba(255, 100, 103, 0.8)",
          }}
        >
          {title}
        </h1>
      </header>

      {/* Keyframes for flashing active tile */}
      <style>
        {`
          @keyframes flashRed {
            0% { background-color: rgba(255,100,103,0.2); box-shadow: 0 0 4px rgba(255,100,103,0.2);}
            50% { background-color: rgba(255,100,103,0.6); box-shadow: 0 0 12px rgba(255,100,103,0.5);}
            100% { background-color: rgba(255,100,103,0.2); box-shadow: 0 0 4px rgba(255,100,103,0.2);}
          }
        `}
      </style>

      {/* Tiles */}
      <div
        className="grid flex-1"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: cellSize,
          rowGap: "12px",
          columnGap: "16px",
        }}
      >
        {items.map((i) => {
          const status = getStatus(i);
          let borderColor = "#522546";
          let hoverBorder = "#6B3F63";
          let animationStyle: React.CSSProperties = {};
          const backgroundColor = "transparent";

          if (status === "active") {
            borderColor = "#FF6467";
            hoverBorder = "#FF8A8F";
            animationStyle = { animation: "flashRed 2.5s infinite linear" };
          } else if (status === "done") {
            borderColor = "#89304E";
            hoverBorder = "#A04561";
          } else if (status === "locked") {
            borderColor = "#522546";
            hoverBorder = "#6B3F63";
          }

          return (
            <button
              key={i}
              onClick={() => handleCellClick(i)}
              className="flex items-center justify-center font-mono text-foreground/90 rounded-md transition-all duration-150 cursor-pointer"
              style={{
                border: `2px solid ${borderColor}`,
                backgroundColor,
                fontSize: `clamp(12px, calc(${cellSize} / 2.5), 18px)`,
                ...animationStyle,
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.borderColor =
                  hoverBorder)
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.borderColor =
                  borderColor)
              }
            >
              {i}
            </button>
          );
        })}
      </div>

      {/* Vertical Legend */}
      <ul className="mt-2 flex flex-col gap-2 text-sm">
        <li className="inline-flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full bg-[#FF6467] shadow-[0_0_8px_rgba(255,100,103,0.6)]" />
          <span
            className="font-monospace"
            style={{
              color: "#FF6467",
              textShadow: "0 0 4px rgba(255,100,103,0.6)",
            }}
          >
            ACTIVE
          </span>
        </li>
        <li className="inline-flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full bg-[#89304E] shadow-[0_0_6px_rgba(137,48,78,0.4)]" />
          <span
            className="font-monospace"
            style={{
              color: "#89304E",
              textShadow: "0 0 4px rgba(137,48,78,0.4)",
            }}
          >
            DONE
          </span>
        </li>
        <li className="inline-flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full border border-[#522546]" />
          <span
            className="font-monospace"
            style={{
              color: "#522546",
              textShadow: "0 0 4px rgba(82,37,70,0.4)",
            }}
          >
            LOCKED
          </span>
        </li>
      </ul>
    </section>
  );
}
