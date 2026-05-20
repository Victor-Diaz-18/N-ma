import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import { installSyncListeners } from "@/lib/sync";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register Service Worker for PWA / offline support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // eslint-disable-next-line no-console
        console.log("NUMA SW registered:", reg.scope);
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn("NUMA SW registration failed:", e);
      });
  });
}

// Install background sync for queued submissions
installSyncListeners();
