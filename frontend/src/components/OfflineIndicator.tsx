import { useEffect, useState } from "react";
import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { offlineCache } from "../services/offlineCache";

export default function OfflineIndicator() {
  const online = useOnlineStatus();
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const stats = await offlineCache.getStats();
      if (mounted) setPendingCount(stats.pending);
    };
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [online]);

  useEffect(() => {
    if (online) {
      setShowOnlineBanner(true);
      const t = setTimeout(() => setShowOnlineBanner(false), 2500);
      return () => clearTimeout(t);
    }
  }, [online]);

  const triggerSync = async () => {
    if (!online || syncing) return;
    setSyncing(true);
    try {
      const pending = await offlineCache.getPendingMutations();
      for (const m of pending) {
        try {
          const res = await fetch(m.url, {
            method: m.method,
            headers: { "Content-Type": "application/json", ...(m.headers || {}) },
            body: m.payload ? JSON.stringify(m.payload) : undefined,
          });
          if (res.ok) await offlineCache.deletePendingMutation(m.id);
        } catch {
          // keep in queue
        }
      }
      const stats = await offlineCache.getStats();
      setPendingCount(stats.pending);
    } finally {
      setSyncing(false);
    }
  };

  if (!online) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-center gap-2 bg-warning px-4 py-2 text-sm text-white shadow-md">
        <WifiOff className="size-4" />
        <span className="font-semibold">Mode hors ligne</span>
        <span className="opacity-90">— données en cache disponibles</span>
        {pendingCount > 0 && (
          <span className="ml-2 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
            {pendingCount} modif. en attente
          </span>
        )}
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-center gap-3 bg-header px-4 py-2 text-sm text-white shadow-md">
        <Wifi className="size-4" />
        <span>{pendingCount} modification(s) en attente de synchronisation</span>
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="ml-2 inline-flex h-7 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-header transition-colors hover:bg-white/90 disabled:opacity-60"
        >
          <RefreshCw className={syncing ? "size-3.5 animate-spin" : "size-3.5"} />
          {syncing ? "Synchronisation..." : "Synchroniser"}
        </button>
      </div>
    );
  }

  if (showOnlineBanner) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-center gap-2 bg-success px-4 py-1.5 text-sm font-medium text-white shadow-md transition-opacity">
        <Wifi className="size-3.5" />
        <span>Connexion rétablie</span>
      </div>
    );
  }

  return null;
}
