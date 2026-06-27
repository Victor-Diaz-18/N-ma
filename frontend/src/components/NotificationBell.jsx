import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.items);
      setUnread(data.unread_count);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id) => {
    try {
      await api.post("/notifications/mark-read", { notification_id: id });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch (e) { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.post("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (e) { /* ignore */ }
  };

  return (
    <div className="relative" ref={ref} data-testid="notification-bell">
      <button
        onClick={() => setOpen(!open)}
        className="relative px-2 py-1.5 bg-white nb-border nb-press"
        data-testid="notification-toggle"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#FF6B6B] text-white text-[0.6rem] font-bold w-4 h-4 flex items-center justify-center nb-border" data-testid="notification-unread-count">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white nb-border nb-shadow z-50 max-h-96 overflow-y-auto" data-testid="notification-dropdown">
          <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[#1F5A2A]">
            <span className="font-display font-black text-sm">Notificaciones</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs font-bold underline" data-testid="mark-all-read-btn">
                Marcar todo leído
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-[#3E5A3E]">Sin notificaciones</div>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                to={n.link || "#"}
                onClick={() => { markRead(n.id); setOpen(false); }}
                className={`block px-3 py-2.5 border-b border-[#E0E0E0] hover:bg-[#F5F1E4] transition ${n.read ? "" : "bg-[#E8F5E9]"}`}
                data-testid={`notification-${n.id}`}
              >
                <div className="font-bold text-sm">{n.title}</div>
                <div className="text-xs text-[#3E5A3E]">{n.message}</div>
                <div className="text-[0.65rem] text-[#999] mt-0.5">{new Date(n.created_at).toLocaleString("es-ES")}</div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
