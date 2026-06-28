import React from "react";
import { useTheme } from "../lib/theme";

function useDark() {
  const { theme } = useTheme();
  return theme === "dark";
}

export function NBCard({ children, className = "", color = "white", ...props }) {
  const dark = useDark();
  const lightBg = { white: "bg-white", yellow: "bg-[#8BC34A]", purple: "bg-[#A5D6A7]",
                    teal: "bg-[#C5E1A5]", red: "bg-[#FF6B6B]", cream: "bg-[#F5F1E4]" }[color] || color;
  const darkBg = { white: "bg-[#27272a]", yellow: "bg-[#2d3a1e]", purple: "bg-[#1e3020]",
                   teal: "bg-[#1e2e28]", red: "bg-[#3a1e1e]", cream: "bg-[#27272a]" }[color] || color;
  const bg = dark ? darkBg : lightBg;
  return (
    <div className={`${bg} nb-border nb-shadow ${className}`} {...props}>
      {children}
    </div>
  );
}

export function NBButton({ children, className = "", variant = "primary", ...props }) {
  const dark = useDark();
  const lightVariants = {
    primary: "bg-[#8BC34A] text-[#1F5A2A]",
    dark: "bg-[#1F5A2A] text-white",
    purple: "bg-[#A5D6A7] text-[#1F5A2A]",
    teal: "bg-[#C5E1A5] text-[#1F5A2A]",
    danger: "bg-[#FF6B6B] text-white",
    ghost: "bg-white text-[#1F5A2A]",
  };
  const darkVariants = {
    primary: "bg-[#8BC34A] text-[#18181b]",
    dark: "bg-[#e4e4e7] text-[#18181b]",
    purple: "bg-[#A5D6A7] text-[#18181b]",
    teal: "bg-[#C5E1A5] text-[#18181b]",
    danger: "bg-[#FF6B6B] text-[#18181b]",
    ghost: "bg-[#27272a] text-[#d4d4d8]",
  };
  const v = dark ? darkVariants[variant] : lightVariants[variant];
  return (
    <button
      className={`${v} nb-border nb-shadow nb-press px-5 py-2.5 font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function NBBadge({ children, color = "#8BC34A", className = "" }) {
  return (
    <span className={`inline-block px-2 py-0.5 nb-border text-xs font-bold uppercase tracking-wider ${className}`} style={{ background: color }}>
      {children}
    </span>
  );
}

export function NBInput(props) {
  const dark = useDark();
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 nb-border font-medium focus:outline-none focus:nb-shadow focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all ${dark ? "bg-[#18181b] text-[#fafafa] border-[#3f3f46]" : "bg-white text-[#1F5A2A]"} ${props.className || ""}`}
    />
  );
}

export function NBTextarea(props) {
  const dark = useDark();
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-2.5 nb-border font-medium focus:outline-none focus:nb-shadow focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all ${dark ? "bg-[#18181b] text-[#fafafa] border-[#3f3f46]" : "bg-white text-[#1F5A2A]"} ${props.className || ""}`}
    />
  );
}

export function NBProgress({ value = 0, color = "#A5D6A7" }) {
  const dark = useDark();
  return (
    <div className={`w-full h-5 nb-border overflow-hidden relative ${dark ? "bg-[#27272a]" : "bg-white"}`}>
      <div className="h-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, borderRight: value > 0 && value < 100 ? `2px solid ${dark ? "#18181b" : "#0A0A0A"}` : "none" }} />
      <div className={`absolute inset-0 flex items-center justify-center font-mono font-bold text-xs ${dark ? "text-[#fafafa]" : ""}`}>{value}%</div>
    </div>
  );
}
