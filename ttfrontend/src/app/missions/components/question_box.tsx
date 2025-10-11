import React from "react";
import ReactMarkDown from "react-markdown"
export interface CTFCardProps {
  title: string;
  description: string;
  difficulty?: string;
  width?: string;
  height?: string;
  lineHeightPx?: number;
  lineOpacity?: number;
  showLines?: boolean;
  chips?: { label: string; color: string; border: string; bg: string }[];
  briefingLabel?: string;
  statuses?: { label: string; dot: string; text: string }[];
  customContent?: React.ReactNode; // NEW: Allow custom content
  points?: number;
}

export default function CTFCard({
  title,
  description,
  difficulty = "HARD",
  width = "100%",
  height = "auto",
  lineHeightPx = 0.5,
  lineOpacity = 0.6,
  showLines = true,
  points,
  chips = [],
  briefingLabel = "Briefing",
  statuses = [],
  customContent, // NEW
}: CTFCardProps) {
  return (
    <section
      className="rounded-lg border-2 p-6 md:p-7 bg-black/100 border-[#522546] shadow-[0_0_0_1px_rgba(173,70,255,0.2)] w-full max-w-[1000px]"
      style={{ height }}
    >
      {/* Top row: title + chips */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1
            className="font-vt323 text-[30px] leading-9 tracking-[0.75px] text-[#F73750] font-bold"
            style={{
              textShadow: "0 0 12px #F73750, 0 0 24px #F73750, 0 0 36px #F73750",
            }}
          >
            {title}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            {chips.map((c, idx) => (
              <span
                key={idx}
                className="px-4 py-1 rounded-[5px] border text-[12px] leading-4 tracking-[2.4px] font-vt323 font-bold"
                style={{ color: c.color, borderColor: c.border, background: c.bg }}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Target line */}
        <div className="flex items-center gap-4">
          <span className="font-vt323 text-sm leading-5 tracking-[0.7px] text-[#99A1AF]">
          </span>
          <div className="flex-1 flex items-center gap-3">
            <div
              className="flex-1"
              style={{
                height: "1.2px",
                background: "linear-gradient(90deg, #522546 0%, #FB2C36 100%)",
                opacity: lineOpacity,
              }}
            />
            <span className="w-[7px] h-[7px] rounded-full bg-[#FB2C36]" />
          </div>
        </div>
      </div>

      {/* Accent line 1 */}
      {showLines && (
        <div
          className="mt-4 w-full"
          style={{
            height: `${lineHeightPx}px`,
            background: "#522546",
            boxShadow: "0 0 4px 0 rgba(168,85,247,0.20)",
            opacity: lineOpacity,
          }}
        />
      )}

      {/* Briefing */}
      <div className="mt-4">
        <h2
          className="font-vt323 text-base leading-6 tracking-[1.6px] uppercase text-[#FF6467]"
          style={{ textShadow: "0 0 16px rgba(248, 113, 113, 0.60)" }}
        >
          {briefingLabel}
        </h2>
      </div>

      {/* Description */}
      <div
        className="mt-3 w-full rounded-[5px] border px-4 py-4"
        style={{ borderColor: "#FB2C36" }}
      >
        <span className="font-vt323 text-base leading-[26px] whitespace-pre-line text-[#D1D5DC]">
          <ReactMarkDown>

          {description}
          </ReactMarkDown>
        </span>
      </div>

      {/* NEW: Custom content section */}
      {customContent && (
        <div className="mt-4">
          {customContent}
        </div>
      )}

      {/* Accent line 2 */}
      {showLines && (
        <div
          className="mt-4 w-full"
          style={{
            height: `${lineHeightPx}px`,
            background: "#522546",
            boxShadow: "0 0 4px 0 rgba(168,85,247,0.20)",
            opacity: lineOpacity,
          }}
        />
      )}

      {/* Status row */}
      <div className="mt-4 flex items-center gap-6 flex-wrap">
        {/* HARD-CODED ACTIVE */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "#89304E" }} />
          <span
            className="font-vt323 text-sm leading-5 tracking-[0.35px]"
            style={{ color: "#89304E" }}
          >
            Active
          </span>
        </div>

        {/* Dynamic statuses */}
        {statuses.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
            <span
              className="font-vt323 text-sm leading-5 tracking-[0.35px]"
              style={{ color: s.text }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
