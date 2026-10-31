"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

/** Registers the offline service worker and shows connectivity state. */
export function OfflineStatus() {
  const [online, setOnline] = useState(true);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker
        .register("./sw.js")
        .then(() => setReady(true))
        .catch(() => setReady(false));
    }
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-slate-500" title="The engine and its data run entirely in this browser; no server or connection is needed once loaded.">
      {online ? <Wifi size={11} className="text-energy-green" /> : <WifiOff size={11} className="text-energy-amber" />}
      {online ? "online" : "offline — still fully functional"}
      {ready ? " · offline-ready" : ""}
    </div>
  );
}
