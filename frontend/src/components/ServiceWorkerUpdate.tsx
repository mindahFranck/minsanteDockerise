import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { registerSW } from "virtual:pwa-register";

export default function ServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateSW, setUpdateSW] = useState<
    ((reload?: boolean) => Promise<void>) | null
  >(null);

  useEffect(() => {
    const fn = registerSW({
      immediate: true,
      onNeedRefresh() {
        setUpdateAvailable(true);
      },
      onOfflineReady() {
        // App ready to work offline
      },
    });
    setUpdateSW(() => fn);
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex max-w-sm items-center gap-3 rounded-2xl bg-header p-4 text-white shadow-lg">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
        <RefreshCw className="size-4" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold">Nouvelle version disponible</p>
        <p className="text-xs text-white/70">Rafraîchissez pour obtenir les dernières fonctionnalités.</p>
      </div>
      <button
        onClick={() => updateSW?.(true)}
        className="inline-flex h-8 shrink-0 items-center rounded-lg bg-white px-3 text-xs font-semibold text-header transition-colors hover:bg-white/90"
      >
        Mettre à jour
      </button>
    </div>
  );
}
