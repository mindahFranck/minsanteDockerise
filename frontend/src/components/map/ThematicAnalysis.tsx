import React, { useEffect, useMemo, useState } from 'react';
import { Layers, Fence, Home, Zap, Loader2, AlertCircle } from 'lucide-react';
import {
  apiService,
  type ThematicData,
  type ThematicEntity,
  type ThematicIndicator,
  type ThematicLevel,
} from '../../services/apiService';

type IndicatorKey = 'titreFoncier' | 'cloture' | 'electricite';

export interface ThematicTheme {
  id: string;
  name: string;
  description: string;
  /** Niveau géographique des polygones à colorer (region, district, airesante…). */
  level: ThematicLevel;
  /** Couleur d'un polygone de la carte, retrouvé par son nom. */
  getColorForName: (name: string) => string;
  /** Libellé de la légende : « avec titre foncier », « avec clôture »… */
  legendLabel: string;
  icon: React.ReactNode;
}

interface ThematicAnalysisProps {
  /** Niveau des entités analysées (celles dont les polygones sont affichés). */
  level: ThematicLevel;
  /** Entité parente (ex. region_id pour les districts d'une région). */
  parent?: { param: string; id: number } | null;
  onThemeChange: (theme: ThematicTheme | null) => void;
}

const THEMES: { id: string; key: IndicatorKey; name: string; description: string; legendLabel: string; icon: React.ReactNode }[] = [
  {
    id: 'titre-foncier',
    key: 'titreFoncier',
    name: 'Titres fonciers',
    description: 'Part des FOSA disposant d’un titre foncier',
    legendLabel: 'avec titre foncier',
    icon: <Home className="w-4 h-4" />,
  },
  {
    id: 'cloture',
    key: 'cloture',
    name: 'Clôtures',
    description: 'Part des FOSA disposant d’une clôture',
    legendLabel: 'avec clôture',
    icon: <Fence className="w-4 h-4" />,
  },
  {
    id: 'electricite',
    key: 'electricite',
    name: 'Électrification',
    description: 'Part des FOSA raccordées au réseau électrique national',
    legendLabel: 'raccordées',
    icon: <Zap className="w-4 h-4" />,
  },
];

const LEVEL_LABELS: Record<ThematicLevel, string> = {
  region: 'Régions',
  departement: 'Départements',
  arrondissement: 'Arrondissements',
  district: 'Districts',
  airesante: 'Aires de santé',
};

/** Couleur d'une entité selon le taux (et gris si elle n'a aucune FOSA rattachée). */
export function colorForIndicator(indicator: ThematicIndicator | undefined, total: number): string {
  if (!indicator || total === 0 || indicator.taux === null) return '#e5e7eb';
  if (indicator.nonRenseigne === total) return '#cbd5e1';
  if (indicator.taux >= 80) return '#10b981';
  if (indicator.taux >= 50) return '#f59e0b';
  if (indicator.taux >= 20) return '#f97316';
  return '#ef4444';
}

const fmt = (n: number) => n.toLocaleString('fr-FR');
const fmtPct = (n: number | null) => (n === null ? '—' : `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`);

const ThematicAnalysis: React.FC<ThematicAnalysisProps> = ({ level, parent, onThemeChange }) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [data, setData] = useState<ThematicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentKey = parent ? `${parent.param}:${parent.id}` : 'national';

  // Les indicateurs sont calculés par le backend (jointure spatiale en base) :
  // chargés dès qu'un thème est actif, puis à chaque changement de périmètre.
  useEffect(() => {
    if (!selectedTheme) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiService
      .getThematic(level, parent ?? undefined)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setData(null);
          setError(err?.response?.data?.message || 'Indicateurs indisponibles');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTheme, level, parentKey]);

  const byName = useMemo(() => {
    const map = new Map<string, ThematicEntity>();
    data?.entities.forEach((entity) => map.set(entity.nom, entity));
    return map;
  }, [data]);

  const activeDef = THEMES.find((t) => t.id === selectedTheme);
  const dataMatches = !!data && data.level === level && (data.parentId ?? null) === (parent?.id ?? null);

  // Propage le thème actif (avec ses couleurs) à la carte.
  useEffect(() => {
    if (!activeDef || !dataMatches) {
      onThemeChange(null);
      return;
    }
    onThemeChange({
      id: activeDef.id,
      name: activeDef.name,
      description: activeDef.description,
      legendLabel: activeDef.legendLabel,
      icon: activeDef.icon,
      level,
      getColorForName: (name: string) => {
        const entity = byName.get(name);
        return entity ? colorForIndicator(entity[activeDef.key], entity.total) : '#e5e7eb';
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDef?.id, dataMatches, byName, level]);

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme((current) => (current === themeId ? '' : themeId));
  };

  const totals = data?.totals;

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
          <Layers className="size-4" />
        </span>
        <h3 className="text-sm font-semibold text-gray-900">Analyse thématique</h3>
        <span className="ml-auto rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">
          {LEVEL_LABELS[level]}
        </span>
      </div>

      <div className="space-y-2">
        {THEMES.map((theme) => {
          const active = selectedTheme === theme.id;
          const indicator = totals?.[theme.key];
          return (
            <div key={theme.id} className="overflow-hidden rounded-xl border border-gray-200">
              <button
                onClick={() => handleThemeChange(theme.id)}
                className={`w-full border-b border-gray-200 p-3 text-left transition-colors ${active ? 'bg-brand-50' : 'bg-white hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-lg p-1.5 ${active ? 'bg-white text-brand-500' : 'bg-gray-100 text-gray-500'}`}>{theme.icon}</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{theme.name}</div>
                      <div className="text-xs text-gray-500">{theme.description}</div>
                    </div>
                  </div>
                  <div className={`h-3 w-3 rounded-full border-2 ${active ? 'border-brand-500 bg-brand-500' : 'border-gray-300 bg-white'}`} />
                </div>
              </button>

              {active && (
                <div className="bg-surface p-3">
                  {loading && (
                    <div className="flex items-center justify-center gap-2 py-3 text-xs text-gray-500">
                      <Loader2 className="size-4 animate-spin" />
                      Calcul des indicateurs…
                    </div>
                  )}
                  {!loading && error && (
                    <div className="flex items-center gap-2 py-2 text-xs text-danger">
                      <AlertCircle className="size-4" />
                      {error}
                    </div>
                  )}
                  {!loading && !error && dataMatches && totals && indicator && (
                    <>
                      <div className="mb-3 rounded-lg border border-gray-200 bg-white p-2.5">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-gray-500">Ensemble du périmètre</span>
                          <span className="text-sm font-bold tabular-nums text-gray-900">{fmtPct(indicator.taux)}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] tabular-nums text-gray-500">
                          {fmt(indicator.oui)} sur {fmt(totals.total)} FOSA {theme.legendLabel}
                          {indicator.nonRenseigne > 0 && ` · ${fmt(indicator.nonRenseigne)} non renseignées`}
                        </p>
                      </div>
                      <div className="max-h-48 space-y-2 overflow-y-auto text-xs">
                        {data!.entities.map((entity) => {
                          const value = entity[theme.key];
                          return (
                            <div key={entity.id} className="group flex items-center justify-between">
                              <span className="mr-2 flex-1 truncate font-medium text-gray-700 group-hover:text-gray-900" title={entity.nom}>
                                {entity.nom}
                              </span>
                              <div className="flex flex-shrink-0 items-center gap-2">
                                {entity.total === 0 ? (
                                  <span className="text-[11px] text-gray-400">Aucune FOSA</span>
                                ) : (
                                  <span
                                    className="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-gray-900"
                                    title={`${fmt(value.oui)} oui · ${fmt(value.non)} non · ${fmt(value.nonRenseigne)} non renseignées`}
                                  >
                                    {fmt(value.oui)}/{fmt(entity.total)} · {fmtPct(value.taux)}
                                  </span>
                                )}
                                <div className="h-3 w-3 rounded shadow-sm" style={{ backgroundColor: colorForIndicator(value, entity.total) }} />
                              </div>
                            </div>
                          );
                        })}
                        {data!.entities.length === 0 && <div className="py-2 text-center text-gray-500">Donnée non disponible</div>}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeDef && dataMatches && data && (
        <p className="mt-3 text-[10px] leading-snug text-gray-500">
          {fmt(data.entities.length)} {LEVEL_LABELS[level].toLowerCase()} · source : base MINSANTÉ (FOSA rattachées par leur position GPS)
        </p>
      )}
    </div>
  );
};

export default ThematicAnalysis;
