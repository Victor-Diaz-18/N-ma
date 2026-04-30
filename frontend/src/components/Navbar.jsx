import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Zap, LogOut, Trophy, User, LayoutDashboard, BookOpen } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  if (!user || user === false) return null;

  const isActive = (p) => loc.pathname === p;
  const linkBase = "px-3 py-1.5 nb-border bg-white text-sm font-bold nb-press";
  const activeCls = "bg-[#FFE156]";

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7] border-b-2 border-black" data-testid="main-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 nb-press" data-testid="nav-logo">
          <div className="w-9 h-9 bg-[#FFE156] nb-border nb-shadow-sm flex items-center justify-center">
            <Zap className="w-5 h-5" strokeWidth={3} />
          </div>
          <span className="font-display font-black text-xl tracking-tight">EduQuest</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          <Link to="/dashboard" className={`${linkBase} ${isActive("/dashboard") ? activeCls : ""}`} data-testid="nav-dashboard">
            <LayoutDashboard className="w-4 h-4 inline mr-1" /> Dashboard
          </Link>
          <Link to="/courses" className={`${linkBase} ${isActive("/courses") ? activeCls : ""}`} data-testid="nav-courses">
            <BookOpen className="w-4 h-4 inline mr-1" /> Courses
          </Link>
          <Link to="/leaderboard" className={`${linkBase} ${isActive("/leaderboard") ? activeCls : ""}`} data-testid="nav-leaderboard">
            <Trophy className="w-4 h-4 inline mr-1" /> Leaderboard
          </Link>
          <Link to="/profile" className={`${linkBase} ${isActive("/profile") ? activeCls : ""}`} data-testid="nav-profile">
            <User className="w-4 h-4 inline mr-1" /> Profile
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#C4A1FF] nb-border">
            <span className="font-mono text-xs font-bold" data-testid="nav-xp">{user.xp} XP</span>
            <span className="w-px h-4 bg-black" />
            <span className="font-mono text-xs font-bold" data-testid="nav-level">LV {user.level}</span>
          </div>
          <button
            onClick={async () => { await logout(); nav("/login"); }}
            className="px-3 py-1.5 bg-white nb-border nb-press text-sm font-bold flex items-center gap-1"
            data-testid="nav-logout-btn"
          >
            <LogOut className="w-4 h-4" /> Exit
          </button>
        </div>
      </div>
    </header>
  );
}
