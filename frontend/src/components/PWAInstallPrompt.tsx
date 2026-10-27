import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 7;

export default function PWAInstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const stillDismissed =
      dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400_000;

    const onBefore = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      if (!stillDismissed) setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    if (outcome !== "accepted") {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setVisible(false);
    setEvt(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible || !evt) return null;

  return (
    <div className="card fixed bottom-4 right-4 z-[9999] max-w-sm p-5 shadow-lg animate-fade-in">
      <button
        onClick={dismiss}
        className="btn-icon absolute right-2 top-2"
        aria-label="Fermer"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
          <Download className="size-5" />
        </div>
        <div className="min-w-0 pr-6">
          <h3 className="font-semibold text-gray-900">Installer MINSANTE</h3>
          <p className="mt-1 text-xs text-gray-500">
            Ajoutez l'application à votre écran d'accueil pour un accès rapide
            et une utilisation hors ligne.
          </p>
          <button
            onClick={install}
            className="btn btn-primary btn-sm mt-3 w-full"
          >
            Installer l'application
          </button>
        </div>
      </div>
    </div>
  );
}
