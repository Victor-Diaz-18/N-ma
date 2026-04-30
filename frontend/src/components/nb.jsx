import React from "react";

export function NBCard({ children, className = "", color = "white", ...props }) {
  const bg = { white: "bg-white", yellow: "bg-[#FFE156]", purple: "bg-[#C4A1FF]",
               teal: "bg-[#98F5E1]", red: "bg-[#FF6B6B]", cream: "bg-[#FDFBF7]" }[color] || color;
  return (
    <div className={`${bg} nb-border nb-shadow ${className}`} {...props}>
      {children}
    </div>
  );
}

export function NBButton({ children, className = "", variant = "primary", ...props }) {
  const variants = {
    primary: "bg-[#FFE156] text-black",
    dark: "bg-black text-white",
    purple: "bg-[#C4A1FF] text-black",
    teal: "bg-[#98F5E1] text-black",
    danger: "bg-[#FF6B6B] text-white",
    ghost: "bg-white text-black",
  };
  return (
    <button
      className={`${variants[variant]} nb-border nb-shadow nb-press px-5 py-2.5 font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function NBBadge({ children, color = "#FFE156", className = "" }) {
  return (
    <span className={`inline-block px-2 py-0.5 nb-border text-xs font-bold uppercase tracking-wider ${className}`} style={{ background: color }}>
      {children}
    </span>
  );
}

export function NBInput(props) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 nb-border bg-white font-medium focus:outline-none focus:nb-shadow focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all ${props.className || ""}`}
    />
  );
}

export function NBTextarea(props) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-2.5 nb-border bg-white font-medium focus:outline-none focus:nb-shadow focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all ${props.className || ""}`}
    />
  );
}

export function NBProgress({ value = 0, color = "#C4A1FF" }) {
  return (
    <div className="w-full h-5 nb-border bg-white overflow-hidden relative">
      <div className="h-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, borderRight: value > 0 && value < 100 ? "2px solid #0A0A0A" : "none" }} />
      <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs">{value}%</div>
    </div>
  );
}
