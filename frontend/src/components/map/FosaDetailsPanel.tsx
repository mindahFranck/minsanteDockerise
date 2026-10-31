import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Building,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  Phone,
  Shield,
  Stethoscope,
  Users,
  X,
  Zap,
} from "lucide-react";
import { apiService, type FosaDetails, type GeoRef } from "../../services/apiService";

/** Libellé affiché quand la base ne contient pas la donnée (aucune valeur inventée). */
const NA = "Donnée non disponible";

const fmt = (n: number) => n.toLocaleString("fr-FR");

function imageUrl(image: string | null): string | null {
  if (!image) return null;
  if (image.startsWith("http")) return image;
  const base = ((import.meta as any).env?.VITE_API_URL || "").replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "");
  return image.startsWith("/") ? `${base}${image}` : `${base}/storage/${image}`;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
}

const PRIORITIES: Record<string, string> = { low: "Basse", medium: "Moyenne", high: "Haute", urgent: "Urgente" };

function Section({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
            <Icon className="size-4" />
          </span>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
        </div>
        {open ? <ChevronUp className="size-4 text-gray-400" /> : <ChevronDown className="size-4 text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-100 p-4">{children}</div>}
    </div>
  );
}

/** Ligne libellé / valeur ; affiche « Donnée non disponible » si la valeur manque. */
function Row({ label, value }: { label: string; value: React.ReactNode | null | undefined }) {
  const missing = value === null || value === undefined || value === "";
  return (
    <div className="flex items-start justify-between gap-3 py-1 text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={missing ? "text-right italic text-gray-400" : "text-right font-semibold text-gray-900"}>{missing ? NA : value}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-3">
      <p className="kicker">{label}</p>
      {value === null ? (
        <p className="mt-1.5 text-xs italic text-gray-400">{NA}</p>
      ) : (
        <p className="mt-1.5 text-2xl font-bold leading-none tabular-nums text-gray-900">{fmt(value)}</p>
      )}
    </div>
  );
}

function YesNo({ label, value }: { label: string; value: boolean | null }) {
  const tone = value === null ? "bg-gray-100 text-gray-500" : value ? "bg-success-soft text-success" : "bg-danger-soft text-danger";
  return (
    <div className={`rounded-xl p-3 ${tone.split(" ")[0]}`}>
      <p className="kicker mb-1">{label}</p>
      <p className={`font-bold ${value === null ? "text-xs italic" : "text-lg"} ${tone.split(" ")[1]}`}>{value === null ? NA : value ? "Oui" : "Non"}</p>
    </div>
  );
}

const geo = (ref: GeoRef | null) => (ref ? (ref.code ? `${ref.nom} (${ref.code})` : ref.nom) : null);

export default function FosaDetailsPanel({ fosaId, fallbackName, onClose }: { fosaId: string | number; fallbackName: string; onClose: () => void }) {
  const [details, setDetails] = useState<FosaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setImageFailed(false);
    setLoading(true);
    setError(null);
    setDetails(null);
    apiService
      .getFosaDetails(fosaId)
      .then((data) => !cancelled && setDetails(data))
      .catch((err: any) => !cancelled && setError(err?.response?.data?.message || "Impossible de charger la fiche de la FOSA"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fosaId]);

  const d = details;
  const img = imageUrl(d?.image ?? null);

  return (
    <div className="z-[1000] h-full w-[420px] overflow-y-auto border-r border-gray-200 bg-surface custom-scrollbar">
      <div className="sticky top-0 z-10 bg-header p-4 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-white/60">Formation sanitaire</p>
            <h3 className="text-lg font-bold leading-tight">{d?.nom ?? fallbackName}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/85 transition-colors hover:bg-white/10" aria-label="Fermer">
            <X className="size-4" />
          </button>
        </div>
        {d && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold text-white ${d.estFerme ? "bg-gray-500" : "bg-success"}`}>
              <span className="size-1.5 rounded-full bg-white" />
              {d.estFerme ? "Fermée" : "Ouverte"}
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-1">
              <strong>Statut :</strong> {d.statut ?? "non renseigné"}
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-1">
              <strong>Catégorie :</strong> {d.categorie ?? "non renseignée"}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="size-5 animate-spin" /> Chargement de la fiche…
          </div>
        )}
        {!loading && error && (
          <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm text-danger">
            <AlertCircle className="size-4" /> {error}
          </div>
        )}

        {d && (
          <>
            {img && !imageFailed ? (
              <div className="h-48 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                <img src={img} alt={d.nom} className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
              </div>
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-xl border border-gray-200 bg-white">
                <div className="text-center text-gray-400">
                  <Building className="mx-auto mb-2 size-10" />
                  <p className="text-sm">Image non disponible</p>
                </div>
              </div>
            )}

            <Section title="Localisation" icon={MapPin}>
              <Row label="Région" value={geo(d.localisation.region)} />
              <Row label="Département" value={geo(d.localisation.departement)} />
              <Row label="Arrondissement" value={geo(d.localisation.arrondissement)} />
              <Row label="District de santé" value={geo(d.localisation.district)} />
              <Row label="Aire de santé" value={geo(d.localisation.airesante)} />
              <Row
                label="Coordonnées GPS"
                value={
                  d.localisation.latitude !== null && d.localisation.longitude !== null
                    ? `${d.localisation.latitude.toFixed(5)}, ${d.localisation.longitude.toFixed(5)}`
                    : null
                }
              />
              <Row label="Type (source)" value={d.type} />
              <Row label="Fonctionnelle" value={d.fonctionnelle === null ? null : d.fonctionnelle ? "Oui" : "Non"} />
            </Section>

            <Section title="Capacité et ressources" icon={Activity}>
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Lits" value={d.capaciteLits} />
                <Metric label="Bâtiments" value={d.batiments.total} />
                <Metric label="Services" value={d.services.total} />
                <Metric label="Personnel" value={d.personnel.total} />
                <Metric label="Équip. biomédicaux" value={d.equipements.biomedicaux} />
                <Metric label="Autres équipements" value={d.equipements.autres} />
                <Metric label="Véhicules" value={d.vehicules.total} />
                <Metric label="Ambulances" value={d.vehicules.ambulances} />
              </div>
              {d.batiments.parEtat.length > 0 && (
                <p className="mt-3 text-xs text-gray-500">
                  Bâtiments par état : {d.batiments.parEtat.map((row) => `${row.label} (${fmt(row.total)})`).join(" · ")}
                </p>
              )}
              {d.patients && (
                <div className="mt-3">
                  <Row label="Patients (dernier relevé)" value={d.patients.total !== null ? fmt(d.patients.total) : null} />
                  <Row label="dont ambulants" value={d.patients.ambulants !== null ? fmt(d.patients.ambulants) : null} />
                </div>
              )}
            </Section>

            <Section title="Services" icon={Stethoscope} defaultOpen={d.services.total > 0}>
              {d.services.liste.length === 0 ? (
                <p className="py-2 text-center text-xs italic text-gray-400">Aucun service enregistré pour cette FOSA</p>
              ) : (
                <ul className="space-y-1.5">
                  {d.services.liste.map((service) => (
                    <li key={service.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs even:bg-row-alt">
                      <span className="font-medium text-gray-800">{service.nom}</span>
                      <span className="tabular-nums text-gray-500">
                        {fmt(service.equipementsBiomedicaux)} {service.equipementsBiomedicaux > 1 ? "équip. biomédicaux" : "équip. biomédical"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Personnel" icon={Users} defaultOpen={d.personnel.total > 0}>
              {d.personnel.parCategorie.length === 0 ? (
                <p className="py-2 text-center text-xs italic text-gray-400">Aucun personnel enregistré pour cette FOSA</p>
              ) : (
                d.personnel.parCategorie.map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg px-2 py-1.5 even:bg-row-alt">
                    <span className="text-xs text-gray-700">{row.label}</span>
                    <span className="text-sm font-bold tabular-nums text-gray-900">{fmt(row.total)}</span>
                  </div>
                ))
              )}
            </Section>

            <Section title="Sécurité foncière" icon={Shield}>
              <div className="grid grid-cols-2 gap-2">
                <YesNo label="Titre foncier" value={d.securite.titreFoncier} />
                <YesNo label="Clôture" value={d.securite.cloture} />
              </div>
            </Section>

            <Section title="Énergie" icon={Zap} defaultOpen={false}>
              <Row label="Raccordée au réseau national" value={d.energie.connecteeElectricite === null ? null : d.energie.connecteeElectricite ? "Oui" : "Non"} />
              <Row label="Type de courant" value={d.energie.typeCourant} />
            </Section>

            <Section title="Maintenance" icon={AlertTriangle} defaultOpen={false}>
              <Row label="Dernière inspection" value={formatDate(d.maintenance.derniereInspection)} />
              <Row label="Prochaine inspection" value={formatDate(d.maintenance.prochaineInspection)} />
              <Row label="Priorité" value={d.maintenance.priorite ? PRIORITIES[d.maintenance.priorite] ?? d.maintenance.priorite : null} />
              {d.maintenance.problemes && d.maintenance.problemes.length > 0 ? (
                <ul className="mt-2 space-y-1 rounded-xl border border-danger/20 bg-danger-soft p-3 text-xs text-danger">
                  {d.maintenance.problemes.map((issue) => (
                    <li key={issue} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Row label="Problèmes signalés" value={null} />
              )}
            </Section>

            <Section title="Contact" icon={Phone} defaultOpen={false}>
              <Row label="Téléphone" value={d.contact.telephone} />
              <Row label="E-mail" value={d.contact.email} />
              <Row label="Responsable" value={d.contact.responsableNom} />
              <Row label="Tél. responsable" value={d.contact.responsableTelephone} />
              <Row label="Directeur" value={d.contact.nomDirecteur} />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
