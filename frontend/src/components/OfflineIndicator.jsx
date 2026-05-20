import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { pendingCount, syncPending } from "../lib/sync";

export default function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshCount = async () => setPending(await pendingCount());

  useEffect(() => {
    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    refreshCount();
    const t = setInterval(refreshCount, 5000);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
      clearInterval(t);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await syncPending();
    await refreshCount();
    setSyncing(false);
  };

  if (online && pending === 0) {
    return (
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 nb-border bg-[#C5E1A5]" data-testid="offline-indicator-online" title="En línea">
        <Wifi className="w-3.5 h-3.5" strokeWidth={2.5} />
        <span className="font-mono text-[0.65rem] font-bold">EN LÍNEA</span>
      </div>
    );
  }

  return (
    <button
      onClick={online ? handleSync : undefined}
      className={`flex items-center gap-1.5 px-2.5 py-1 nb-border ${online ? "bg-[#8BC34A] nb-press" : "bg-[#FF6B6B] text-white"}`}
      data-testid={online ? "offline-indicator-pending" : "offline-indicator-offline"}
      title={online ? "Sincronizar entregas pendientes" : "Sin conexión - las entregas se guardarán localmente"}
    >
      {online ? (
        syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
                : <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.5} />
      ) : (
        <WifiOff className="w-3.5 h-3.5" strokeWidth={2.5} />
      )}
      <span className="font-mono text-[0.65rem] font-bold">
        {online ? (pending > 0 ? `${pending} POR SINCR.` : "SINCR.") : "SIN CONEXIÓN"}
      </span>
    </button>
  );
}
