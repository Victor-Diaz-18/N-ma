import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import OfflineIndicator from "./OfflineIndicator";
import { LogOut, Trophy, User, LayoutDashboard, BookOpen, Menu, X } from "lucide-react";

const LOGO_URL = "/logo.svg";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user || user === false) return null;

  const isActive = (p) => loc.pathname === p;
  const linkBase = "px-3 py-1.5 nb-border bg-white text-sm font-bold nb-press";
  const activeCls = "bg-[#8BC34A]";
  const mobileLinkBase = "block px-4 py-3 nb-border bg-white text-sm font-bold nb-press";

  const navLinks = [
    { to: "/dashboard", label: "Panel", icon: LayoutDashboard },
    { to: "/courses", label: "Cursos", icon: BookOpen },
    { to: "/leaderboard", label: "Ranking", icon: Trophy },
    { to: "/profile", label: "Perfil", icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#F5F1E4] border-b-2 border-[#1F5A2A]" data-testid="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 nb-press" data-testid="nav-logo">
          <img src={LOGO_URL} alt="NUMA" className="w-11 h-11 nb-border object-cover bg-white" />
          <span className="font-display font-black text-xl tracking-tight text-[#1F5A2A]">NUMA</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`${linkBase} ${isActive(link.to) ? activeCls : ""}`}
              data-testid={`nav-${link.label.toLowerCase()}`}
            >
              <link.icon className="w-4 h-4 inline mr-1" /> {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <OfflineIndicator />
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#A5D6A7] nb-border">
            <span className="font-mono text-xs font-bold" data-testid="nav-xp">{user.xp} XP</span>
            <span className="w-px h-4 bg-[#1F5A2A]" />
            <span className="font-mono text-xs font-bold" data-testid="nav-level">NV {user.level}</span>
          </div>
          <button
            onClick={async () => { await logout(); nav("/login"); }}
            className="hidden sm:flex px-3 py-1.5 bg-white nb-border nb-press text-sm font-bold items-center gap-1"
            data-testid="nav-logout-btn"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden px-2 py-1.5 bg-white nb-border nb-press"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="nav-mobile-toggle"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t-2 border-[#1F5A2A] bg-[#F5F1E4] p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`${mobileLinkBase} ${isActive(link.to) ? activeCls : ""}`}
            >
              <link.icon className="w-4 h-4 inline mr-2" /> {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#A5D6A7] nb-border mt-2">
            <span className="font-mono text-xs font-bold">{user.xp} XP</span>
            <span className="w-px h-4 bg-[#1F5A2A]" />
            <span className="font-mono text-xs font-bold">NV {user.level}</span>
          </div>
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
