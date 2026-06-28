import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useTheme } from "../lib/theme";
import OfflineIndicator from "./OfflineIndicator";
import NotificationBell from "./NotificationBell";
import { LogOut, Trophy, User, LayoutDashboard, BookOpen, Menu, X, Sun, Moon } from "lucide-react";

const LOGO_URL = "/logo.svg";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const nav = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user || user === false) return null;

  const isActive = (p) => loc.pathname === p;
  const navBg = dark ? "#18181b" : "#F5F1E4";
  const navText = dark ? "#fafafa" : "#1F5A2A";
  const cardBg = dark ? "#27272a" : "white";

  const navLinks = [
    { to: "/dashboard", label: "Panel", icon: LayoutDashboard },
    { to: "/courses", label: "Cursos", icon: BookOpen },
    { to: "/leaderboard", label: "Ranking", icon: Trophy },
    { to: "/profile", label: "Perfil", icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 border-b-2" style={{ background: navBg, borderColor: navText }} data-testid="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 nb-press" data-testid="nav-logo">
          <img src={LOGO_URL} alt="NUMA" className="w-11 h-11 nb-border object-cover" style={{ background: cardBg }} />
          <span className="font-display font-black text-xl tracking-tight" style={{ color: navText }}>NUMA</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 nb-border text-sm font-bold nb-press ${isActive(link.to) ? "bg-[#8BC34A]" : ""}`}
              style={{ background: isActive(link.to) ? "#8BC34A" : cardBg, color: navText }}
              data-testid={`nav-${link.label.toLowerCase()}`}
            >
              <link.icon className="w-4 h-4 inline mr-1" /> {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <OfflineIndicator />
          <NotificationBell />
          <button
            onClick={toggle}
            className="px-2 py-1.5 nb-border nb-press"
            style={{ background: cardBg, color: navText }}
            title={dark ? "Modo claro" : "Modo oscuro"}
            data-testid="theme-toggle"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#A5D6A7] nb-border" style={{ color: "#1F5A2A" }}>
            <span className="font-mono text-xs font-bold" data-testid="nav-xp">{user.xp} XP</span>
            <span className="w-px h-4" style={{ background: "#1F5A2A" }} />
            <span className="font-mono text-xs font-bold" data-testid="nav-level">NV {user.level}</span>
          </div>
          <button
            onClick={async () => { await logout(); nav("/login"); }}
            className="hidden sm:flex px-3 py-1.5 nb-border nb-press text-sm font-bold items-center gap-1"
            style={{ background: cardBg, color: navText }}
            data-testid="nav-logout-btn"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden px-2 py-1.5 nb-border nb-press"
            style={{ background: cardBg, color: navText }}
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="nav-mobile-toggle"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t-2 p-4 space-y-2" style={{ borderColor: navText, background: navBg, color: navText }}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 nb-border text-sm font-bold nb-press ${isActive(link.to) ? "bg-[#8BC34A]" : ""}`}
              style={{ background: isActive(link.to) ? "#8BC34A" : cardBg, color: navText }}
            >
              <link.icon className="w-4 h-4 inline mr-2" /> {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#A5D6A7] nb-border mt-2" style={{ color: "#1F5A2A" }}>
            <span className="font-mono text-xs font-bold">{user.xp} XP</span>
            <span className="w-px h-4" style={{ background: "#1F5A2A" }} />
            <span className="font-mono text-xs font-bold">NV {user.level}</span>
          </div>
          <button
            onClick={toggle}
            className="w-full px-4 py-3 nb-border nb-press text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: cardBg, color: navText }}
            data-testid="theme-toggle-mobile"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {dark ? "Modo claro" : "Modo oscuro"}
          </button>
          <button
            onClick={async () => { setMobileOpen(false); await logout(); nav("/login"); }}
            className="w-full px-4 py-3 bg-[#FF6B6B] text-white nb-border nb-press text-sm font-bold flex items-center justify-center gap-1"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      )}
    </header>
  );
}
