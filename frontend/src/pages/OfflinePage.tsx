import { useEffect, useState } from "react";
import {
  WifiOff,
  Database,
  HardDrive,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Smartphone,
  Map as MapIcon,
  Info,
} from "lucide-react";
import { Badge, PageHeader, SectionCard } from "../components/ui";
import { offlineCache } from "../services/offlineCache";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

interface CacheInfo {
  name: string;
  count: number;
  bytes: number;
}

async function getCacheStorageStats(): Promise<{
  caches: CacheInfo[];
  totalBytes: number;
}> {
  if (!("caches" in window)) return { caches: [], totalBytes: 0 };
  const names = await caches.keys();
  const out: CacheInfo[] = [];
  let total = 0;
  for (const name of names) {
    const c = await caches.open(name);
    const reqs = await c.keys();
    let bytes = 0;
    for (const r of reqs) {
      try {
        const res = await c.match(r);
        if (res) {
          const buf = await res.clone().arrayBuffer();
          bytes += buf.byteLength;
        }
      } catch {
        /* ignore */
      }
    }
    out.push({ name, count: reqs.length, bytes });
    total += bytes;
  }
  return { caches: out, totalBytes: total };
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} Ko`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} Mo`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} Go`;
}

export default function OfflinePage() {
  const online = useOnlineStatus();
  const [stats, setStats] = useState<{
    fosas: number;
    geoEntries: number;
    pending: number;
    fosasUpdatedAt: number | null;
  }>({ fosas: 0, geoEntries: 0, pending: 0, fosasUpdatedAt: null });
  const [cacheData, setCacheData] = useState<{ caches: CacheInfo[]; totalBytes: number }>({
    caches: [],
    totalBytes: 0,
  });
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);
  const [installState, setInstallState] = useState<"unknown" | "installed" | "installable">(
    "unknown",
  );

  const refresh = async () => {
    setLoading(true);
    const [s, c] = await Promise.all([offlineCache.getStats(), getCacheStorageStats()]);
    setStats(s);
    setCacheData(c);
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const est = await navigator.storage.estimate();
      setStorage({ usage: est.usage || 0, quota: est.quota || 0 });
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setInstallState(isStandalone ? "installed" : "installable");
  }, []);

  const clearTiles = async () => {
    if (!("caches" in window)) return;
    setClearing("tiles");
    await caches.delete("map-tiles");
    await refresh();
    setClearing(null);
  };

  const clearApi = async () => {
    if (!("caches" in window)) return;
    setClearing("api");
    await caches.delete("api-data");
    await caches.delete("fosa-images");
    await offlineCache.clearAll();
    await refresh();
    setClearing(null);
  };

  const clearAll = async () => {
    setClearing("all");
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
    await offlineCache.clearAll();
    await refresh();
    setClearing(null);
  };

  const reSync = async () => {
    setClearing("sync");
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg && (reg as any).sync) {
        await (reg as any).sync.register("minsante-api-queue").catch(() => {});
      }
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
          /* keep */
        }
      }
      await refresh();
    } finally {
      setClearing(null);
    }
  };

  const formatDate = (t: number | null) => {
    if (!t) return "—";
    const d = new Date(t);
    return d.toLocaleString("fr-FR");
  };

  const tilesCache = cacheData.caches.find((c) => c.name === "map-tiles");
  const apiCache = cacheData.caches.find((c) => c.name === "api-data");
  const imagesCache = cacheData.caches.find((c) => c.name === "fosa-images");

  const quotaPct = storage ? Math.min(100, (storage.usage / Math.max(storage.quota, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Outils"
        title="Mode hors ligne"
        description="Gérez le cache local pour utiliser l'application sans connexion (terrain)."
        actions={
          <button onClick={refresh} disabled={loading} className="btn btn-outline">
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            Actualiser
          </button>
        }
      />

      {/* Statut */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="kicker">Connexion</p>
            <Badge variant={online ? "success" : "warning"} withDot>
              {online ? "En ligne" : "Hors ligne"}
            </Badge>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            {online ? (
              <>
                <CheckCircle2 className="size-4 text-success" />
                Connecté
              </>
            ) : (
              <>
                <WifiOff className="size-4 text-warning" />
                Hors ligne
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {online
              ? "Les données sont synchronisées avec le serveur."
              : "Utilisation du cache local. Les modifications seront synchronisées au retour."}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="kicker">Installation</p>
            <Smartphone className="size-4 text-gray-400" />
          </div>
          <p className="mt-3 text-sm font-semibold text-gray-900">
            {installState === "installed" ? "Application installée" : "Installation possible"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {installState === "installed"
              ? "L'application est installée sur cet appareil."
              : "Vous pouvez installer l'app via le menu de votre navigateur."}
          </p>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="kicker">Quota navigateur</p>
            <HardDrive className="size-4 text-gray-400" />
          </div>
          {storage ? (
            <>
              <p className="mt-3 text-sm font-semibold tabular-nums text-gray-900">
                {formatBytes(storage.usage)} <span className="font-normal text-gray-500">/ {formatBytes(storage.quota)}</span>
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-track">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${quotaPct}%` }} />
              </div>
            </>
          ) : (
            <p className="mt-3 text-xs text-gray-400">Information non disponible</p>
          )}
        </div>
      </div>

      {/* Données */}
      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <Database className="size-4 text-brand-500" />
            Données en cache
          </span>
        }
        actions={
          stats.pending > 0 && online ? (
            <button onClick={reSync} disabled={clearing !== null} className="btn btn-primary btn-sm">
              <RefreshCw className={clearing === "sync" ? "size-4 animate-spin" : "size-4"} />
              Synchroniser maintenant ({stats.pending})
            </button>
          ) : undefined
        }
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MiniStat label="FOSA" value={stats.fosas} hint={formatDate(stats.fosasUpdatedAt)} />
          <MiniStat label="Géo (spatial)" value={stats.geoEntries} hint="jeux de polygones" />
          <MiniStat
            label="En attente"
            value={stats.pending}
            hint="à synchroniser"
            tone={stats.pending > 0 ? "text-warning" : undefined}
          />
          <MiniStat label="Tuiles carte" value={tilesCache?.count || 0} hint={formatBytes(tilesCache?.bytes || 0)} />
        </div>
      </SectionCard>

      {/* Détail des caches */}
      <SectionCard
        flush
        title={
          <span className="flex items-center gap-2">
            <MapIcon className="size-4 text-brand-500" />
            Caches Workbox
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th>Cache</th>
                <th className="!text-right">Entrées</th>
                <th className="!text-right">Taille</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {cacheData.caches.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center !text-gray-400">
                    Aucun cache (le service worker n'est peut-être pas encore enregistré)
                  </td>
                </tr>
              )}
              {cacheData.caches.map((c) => (
                <tr key={c.name}>
                  <td className="font-mono !text-xs !text-gray-700">{c.name}</td>
                  <td className="text-right tabular-nums">{c.count}</td>
                  <td className="text-right tabular-nums !text-gray-500">{formatBytes(c.bytes)}</td>
                </tr>
              ))}
              {cacheData.caches.length > 0 && (
                <tr className="!bg-gray-50 font-semibold">
                  <td>TOTAL</td>
                  <td className="text-right tabular-nums">{cacheData.caches.reduce((s, c) => s + c.count, 0)}</td>
                  <td className="text-right tabular-nums">{formatBytes(cacheData.totalBytes)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Actions */}
      <SectionCard
        title={
          <span className="flex items-center gap-2">
            <Trash2 className="size-4 text-danger" />
            Vider le cache
          </span>
        }
        subtitle="Libérer de l'espace en supprimant les données mises en cache. L'application devra retélécharger les données la prochaine fois qu'elle sera utilisée en ligne."
      >
        <div className="flex flex-wrap gap-2">
          <button onClick={clearTiles} disabled={clearing !== null} className="btn btn-outline">
            Tuiles carte ({tilesCache ? formatBytes(tilesCache.bytes) : "0"})
          </button>
          <button onClick={clearApi} disabled={clearing !== null} className="btn btn-outline">
            Données API (
            {formatBytes((apiCache?.bytes || 0) + (imagesCache?.bytes || 0))})
          </button>
          <button onClick={clearAll} disabled={clearing !== null} className="btn btn-danger ml-auto">
            Tout vider
          </button>
        </div>
      </SectionCard>

      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4 text-xs text-brand-900">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-500" />
        <p>
          <strong>Conseil terrain :</strong> avant de vous rendre dans une zone sans réseau,
          ouvrez la carte, zoomez sur votre zone d'intervention et utilisez le bouton{" "}
          <em>Hors ligne</em> en bas à droite pour pré-télécharger les tuiles. Les FOSA de la
          région et leurs détails seront aussi automatiquement mis en cache.
        </p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, hint, tone }: { label: string; value: number; hint: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-4">
      <p className="kicker">{label}</p>
      <p className={`mt-2 text-2xl font-bold leading-none tabular-nums ${tone ?? "text-gray-900"}`}>{value}</p>
      <p className="mt-2 font-mono text-xs text-gray-500">{hint}</p>
    </div>
  );
}
