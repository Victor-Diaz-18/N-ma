import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { pendingCount } from "@/lib/sync";

export default function OfflineIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    const check = async () => setPending(await pendingCount());
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [online]);

  if (online && pending === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold"
      style={{
        background: online ? "#8BC34A" : "#FF6B6B",
        color: online ? "#1F5A2A" : "#fff",
      }}
    >
      {online ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          Sincronizando {pending} entrega{pending !== 1 ? "s" : ""} pendiente{pending !== 1 ? "s" : ""}...
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          Sin conexión — el contenido offline está disponible
        </>
      )}
    </div>
  );
}
