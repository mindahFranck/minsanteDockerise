"use client"

import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { AlertCircle, Map, RefreshCw } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import api from "../services/api"
import {
  PageHeader, StatCard, SectionCard, Segmented, SearchInput, RankBars, EmptyState, Badge,
  formatNumber, formatPercent, percent, cn,
} from "../components/ui"

/* --- Forme de GET /statistics/dashboard ------------------------------------ */

interface Breakdown {
  label: string
  total: number
  ouvertes?: number
}

interface RegionRow {
  region: string
  total: number
  ouvertes: number
  electrifiees: number
  securisees: number
  lits: number
}

interface DashboardData {
  fosas: {
    total: number
    ouvertes: number
    fermees: number
    fonctionnelles: number
    electrifiees: number
    titre_foncier: number
    cloturees: number
    securisees: number
    geolocalisees: number
    lits: number
    maintenance_urgente: number
    maintenance_haute: number
    inspections_en_retard: number
  }
  parRegion: RegionRow[]
  parCategorie: Breakdown[]
  parStatut: Breakdown[]
  parType: Breakdown[]
  personnel: { total: number; fosasDotees: number; parCategorie: Breakdown[] }
  batiments: { total: number; superficie: number; parEtat: Breakdown[] }
  equipements: { biomedicaux: number; autres: number }
  vehicules: { total: number; parEtat: Breakdown[]; parEnergie: Breakdown[] }
  patients: { total: number; ambulants: number }
  genereLe: string
}

type Dimension = "categorie" | "statut" | "type" | "region"

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: "type", label: "Type" },
  { value: "region", label: "Région" },
  { value: "statut", label: "Statut" },
  { value: "categorie", label: "Catégorie" },
]

/** Couleurs des séries, dans l'ordre de la palette BAOBAB. */
const CHART_COLORS = ["#007ac3", "#00a832", "#f6821f", "#00395a", "#e5484d", "#e8ebee"]

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  backgroundColor: "#ffffff",
  fontSize: 12,
} as const

/* --- Briques locales --------------------------------------------------------- */

/** Barre de proportion + pourcentage, pour les colonnes du tableau régional. */
function RateCell({ value, total, tone = "brand" }: { value: number; total: number; tone?: "brand" | "success" | "warning" }) {
  const rate = percent(value, total)
  const bar = { brand: "bg-brand-500", success: "bg-success", warning: "bg-warning" }[tone]
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-track">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${rate}%` }} />
      </div>
      <span className="w-14 text-right text-sm font-semibold tabular-nums">{formatPercent(rate)}</span>
    </div>
  )
}

/** Anneau + légende chiffrée. */
function Donut({ slices, centerLabel, centerValue }: { slices: { label: string; value: number }[]; centerLabel: string; centerValue: string }) {
  const total = slices.reduce((acc, slice) => acc + slice.value, 0)
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative size-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="label" innerRadius="68%" outerRadius="100%" paddingAngle={1} stroke="none">
              {slices.map((slice, index) => (
                <Cell key={slice.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => formatNumber(value)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{centerValue}</span>
          <span className="kicker">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {slices.map((slice, index) => (
          <li key={slice.label} className="flex items-center gap-3 text-sm">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
            <span className="flex-1 text-gray-700">{slice.label}</span>
            <span className="font-semibold tabular-nums">{formatNumber(slice.value)}</span>
            <span className="w-14 text-right font-mono text-xs text-gray-500">{formatPercent(percent(slice.value, total))}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-14 w-72 rounded-xl bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-32" />
        ))}
      </div>
      <div className="card h-96" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card h-72" />
        <div className="card h-72" />
      </div>
    </div>
  )
}

/* --- Page ---------------------------------------------------------------------- */

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dimension, setDimension] = useState<Dimension>("type")
  const [query, setQuery] = useState("")
  const [showAll, setShowAll] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get("/statistics/dashboard")
      setData(response.data.data)
    } catch (err: any) {
      console.error("Error loading dashboard:", err)
      setError(err?.response?.data?.message || err?.message || "Erreur lors du chargement des indicateurs")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const breakdown = useMemo(() => {
    if (!data) return []
    const rows: Breakdown[] =
      dimension === "region"
        ? data.parRegion.map((row) => ({ label: row.region, total: row.total, ouvertes: row.ouvertes }))
        : dimension === "statut"
          ? data.parStatut
          : dimension === "type"
            ? data.parType
            : data.parCategorie
    const needle = query.trim().toLowerCase()
    return rows
      .filter((row) => !needle || row.label.toLowerCase().includes(needle))
      .map((row) => ({
        label: row.label,
        value: row.total,
        sub: row.ouvertes != null ? `${formatNumber(row.ouvertes)} ouvertes · ${formatPercent(percent(row.ouvertes, row.total))}` : undefined,
      }))
  }, [data, dimension, query])

  if (loading && !data) return <DashboardSkeleton />

  if (error || !data) {
    return (
      <div className="card">
        <EmptyState
          icon={<AlertCircle />}
          title="Impossible de charger les indicateurs"
          description={error ?? "Aucune donnée disponible"}
          action={
            <button onClick={load} className="btn btn-primary">
              <RefreshCw className="size-4" />
              Réessayer
            </button>
          }
        />
      </div>
    )
  }

  const f = data.fosas
  const tauxOuverture = percent(f.ouvertes, f.total)
  const tfSeul = Math.max(0, f.titre_foncier - f.securisees)
  const clotureSeule = Math.max(0, f.cloturees - f.securisees)
  const aucune = Math.max(0, f.total - (f.titre_foncier + f.cloturees - f.securisees))
  const maintenance = f.maintenance_urgente + f.maintenance_haute
  const litsParFosa = f.ouvertes > 0 ? Math.round((f.lits / f.ouvertes) * 10) / 10 : 0
  const half = Math.ceil(Math.min(breakdown.length, showAll ? breakdown.length : 20) / 2)
  const visible = showAll ? breakdown : breakdown.slice(0, 20)
  const breakdownTotal = breakdown.reduce((acc, row) => acc + row.value, 0)
  const generatedAt = new Date(data.genereLe).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Vue nationale"
        title="Tableau de bord"
        description={`Parc des formations sanitaires du Cameroun · indicateurs calculés le ${generatedAt}`}
        actions={
          <>
            <button onClick={load} disabled={loading} className="btn btn-outline">
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
              Actualiser
            </button>
            <Link to="/" className="btn btn-primary">
              <Map className="size-4" />
              Ouvrir la carte
            </Link>
          </>
        }
      />

      {/* KPI principaux */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="FOSA recensées"
          value={formatNumber(f.total)}
          hint={`${formatNumber(f.ouvertes)} ouvertes · ${formatNumber(f.fermees)} fermées`}
        />
        <StatCard
          label="Taux d'ouverture"
          value={formatPercent(tauxOuverture)}
          tone="brand"
          hint={`${formatNumber(f.fermees)} FOSA fermées`}
          hintTone={f.fermees > 0 ? "danger" : "muted"}
        />
        <StatCard
          label="FOSA électrifiées"
          value={formatPercent(percent(f.electrifiees, f.total))}
          hint={`${formatNumber(f.electrifiees)} déclarées raccordées au réseau`}
        />
        <StatCard
          label="Sécurisation foncière"
          value={formatPercent(percent(f.securisees, f.total))}
          hint={`titre foncier + clôture · ${formatNumber(f.securisees)}`}
        />
        <StatCard
          label="Capacité litière"
          value={f.lits > 0 ? formatNumber(f.lits) : "—"}
          hint={f.lits > 0 ? `${litsParFosa.toLocaleString("fr-FR")} lits / FOSA ouverte` : "non renseignée dans la base"}
        />
        <StatCard
          label="Géolocalisation"
          value={formatPercent(percent(f.geolocalisees, f.total))}
          hint={`${formatNumber(f.total - f.geolocalisees)} sans coordonnées`}
          hintTone={f.total - f.geolocalisees > 0 ? "warning" : "muted"}
        />
      </div>

      {/* Ressources et alertes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Personnel"
          value={formatNumber(data.personnel.total)}
          hint={`${formatNumber(data.personnel.fosasDotees)} FOSA dotées · ${formatPercent(percent(data.personnel.fosasDotees, f.total))}`}
        />
        <StatCard
          label="Équipements biomédicaux"
          value={formatNumber(data.equipements.biomedicaux)}
          hint={`${formatNumber(data.equipements.autres)} autres équipements`}
        />
        <StatCard
          label="Matériel roulant"
          value={formatNumber(data.vehicules.total)}
          hint={data.vehicules.parEtat[0] ? `principal état : ${data.vehicules.parEtat[0].label.toLowerCase()}` : "aucun véhicule"}
        />
        <StatCard
          label="Maintenance prioritaire"
          value={formatNumber(maintenance)}
          tone={maintenance > 0 ? "danger" : "success"}
          hint={`${formatNumber(f.maintenance_urgente)} urgentes · ${formatNumber(f.inspections_en_retard)} inspections en retard`}
          hintTone={f.inspections_en_retard > 0 ? "warning" : "muted"}
        />
      </div>

      {/* Explorateur de répartition */}
      <SectionCard
        title="Répartition des FOSA"
        subtitle="Classement par effectif, avec la part de structures ouvertes"
        actions={
          <Segmented
            options={DIMENSIONS}
            value={dimension}
            onChange={(value) => {
              setDimension(value)
              setShowAll(false)
              setQuery("")
            }}
          />
        }
      >
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
              <p className="kicker">Taux d'ouverture global</p>
              <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums">{formatPercent(tauxOuverture)}</p>
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-brand-100 pt-4">
                <div>
                  <p className="text-xl font-bold tabular-nums">{formatNumber(breakdown.length)}</p>
                  <p className="text-xs text-gray-500">{DIMENSIONS.find((d) => d.value === dimension)?.label.toLowerCase()}s</p>
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums">{formatNumber(f.fonctionnelles)}</p>
                  <p className="text-xs text-gray-500">déclarées fonctionnelles</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-gray-900">FOSA par statut</p>
              <ul className="space-y-3">
                {data.parStatut.slice(0, 5).map((row) => (
                  <li key={row.label} className="grid grid-cols-[minmax(0,1fr)_6rem_2.5rem] items-center gap-3 text-sm">
                    <span className="truncate text-gray-700" title={row.label}>{row.label}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-track">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${percent(row.total, f.total)}%` }} />
                    </div>
                    <span className="text-right font-semibold tabular-nums">{formatNumber(row.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="min-w-0">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={`Rechercher une ${DIMENSIONS.find((d) => d.value === dimension)?.label.toLowerCase()}…`}
              className="mb-4"
            />
            {breakdown.length === 0 ? (
              <EmptyState title="Aucun résultat" description="Modifiez la recherche pour élargir la liste." />
            ) : (
              <div className="grid gap-x-8 xl:grid-cols-2">
                <RankBars items={visible.slice(0, half)} total={breakdownTotal} maxValue={visible[0]?.value} />
                {visible.length > half && (
                  <RankBars items={visible.slice(half)} total={breakdownTotal} maxValue={visible[0]?.value} offset={half} />
                )}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
              <p className="font-mono text-xs text-gray-500">
                {formatNumber(visible.length)} sur {formatNumber(breakdown.length)} · triés par effectif décroissant
              </p>
              {breakdown.length > 20 && (
                <button onClick={() => setShowAll((v) => !v)} className="btn btn-outline btn-sm">
                  {showAll ? "Afficher le top 20" : "Tout afficher"}
                </button>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Couverture régionale */}
      <SectionCard title="Couverture régionale" subtitle="Ouverture, électrification et sécurisation par région" flush>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="table-head">
              <tr>
                <th>Région</th>
                <th className="!text-right">FOSA</th>
                <th>Ouvertes</th>
                <th>Électrifiées</th>
                <th>Sécurisées</th>
                <th className="!text-right">Lits</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {data.parRegion.map((row) => (
                <tr key={row.region}>
                  <td className="font-medium">{row.region}</td>
                  <td className="text-right font-semibold tabular-nums">{formatNumber(row.total)}</td>
                  <td><RateCell value={row.ouvertes} total={row.total} /></td>
                  <td><RateCell value={row.electrifiees} total={row.total} tone="warning" /></td>
                  <td><RateCell value={row.securisees} total={row.total} tone="success" /></td>
                  <td className="text-right tabular-nums">{formatNumber(row.lits)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Sécurisation foncière" subtitle="Titre foncier et clôture des FOSA">
          <Donut
            centerLabel="sécurisées"
            centerValue={formatPercent(percent(f.securisees, f.total))}
            slices={[
              { label: "Titre foncier et clôture", value: f.securisees },
              { label: "Titre foncier seul", value: tfSeul },
              { label: "Clôture seule", value: clotureSeule },
              { label: "Ni l'un ni l'autre", value: aucune },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Patrimoine bâti"
          subtitle={`${formatNumber(data.batiments.total)} bâtiments · ${formatNumber(data.batiments.superficie)} m² recensés`}
        >
          {data.batiments.total === 0 ? (
            <EmptyState title="Aucun bâtiment recensé" description="Les bâtiments ajoutés aux FOSA apparaîtront ici, par état." />
          ) : (
            <Donut
              centerLabel="bâtiments"
              centerValue={formatNumber(data.batiments.total)}
              slices={data.batiments.parEtat.map((row) => ({ label: row.label, value: row.total }))}
            />
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Personnel par catégorie"
          subtitle={`${formatNumber(data.personnel.total)} agents dans ${formatNumber(data.personnel.fosasDotees)} FOSA`}
        >
          {data.personnel.total === 0 ? (
            <EmptyState title="Aucun personnel enregistré" />
          ) : (
            <RankBars items={data.personnel.parCategorie.map((row) => ({ label: row.label, value: row.total }))} limit={10} />
          )}
        </SectionCard>

        <SectionCard title="Matériel roulant" subtitle={`${formatNumber(data.vehicules.total)} véhicules`}>
          {data.vehicules.total === 0 ? (
            <EmptyState title="Aucun véhicule enregistré" />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-900">Par état</p>
                <div className="flex flex-wrap gap-2">
                  {data.vehicules.parEtat.map((row) => (
                    <Badge key={row.label} variant={/bon|neuf/i.test(row.label) ? "success" : /panne|hors|mauvais/i.test(row.label) ? "danger" : "neutral"} withDot>
                      {row.label} · {formatNumber(row.total)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-900">Par énergie</p>
                <RankBars items={data.vehicules.parEnergie.map((row) => ({ label: row.label, value: row.total }))} showPercent limit={5} />
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
