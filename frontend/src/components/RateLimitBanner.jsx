import React, { useState, useEffect } from "react";
import { isRateLimited } from "../lib/api";
import { AlertTriangle } from "lucide-react";

export default function RateLimitBanner() {
  const [limited, setLimited] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const check = () => {
      if (isRateLimited()) {
        setLimited(true);
        const remaining = Math.ceil((Date.now() - (Date.now() - 30000)) / 1000);
        setSeconds(Math.max(1, remaining));
      } else {
        setLimited(false);
      }
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!limited) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#FF6B6B] text-white px-4 py-2.5 nb-border nb-shadow flex items-center gap-2 font-bold text-sm animate-slide-up" data-testid="rate-limit-banner">
      <AlertTriangle className="w-4 h-4" />
      <span>Límite de solicitudes alcanzado. Espera unos segundos.</span>
    </div>
  );
}
