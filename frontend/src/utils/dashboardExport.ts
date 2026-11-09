/**
 * Export du tableau de bord (Excel et PDF), à partir des données réellement
 * chargées depuis GET /statistics/dashboard et des filtres actifs de la page.
 *
 * Ce module est importé à la demande (import() au clic) et charge lui-même
 * xlsx, jspdf, jspdf-autotable et html-to-image à la demande : rien de tout
 * cela n'alourdit le bundle initial.
 */
import type { DashboardData } from "../types/dashboard"
import { deriveDashboard } from "../types/dashboard"

export interface DashboardBreakdownRow {
  label: string
  value: number
  ouvertes?: number
}

export interface DashboardChart {
  title: string
  node: HTMLElement | null
  /** Pleine largeur ou demi-largeur dans le PDF. */
  span: "full" | "half"
}

export interface DashboardExportInput {
  data: DashboardData
  /** Dimension active de l'explorateur « Répartition des FOSA » (Type, Région…). */
  dimensionLabel: string
  /** Recherche saisie dans l'explorateur (vide si aucune). */
  query: string
  /** Lignes de la répartition après filtre (toutes, pas seulement le top 20 affiché). */
  breakdown: DashboardBreakdownRow[]
  /** Blocs graphiques de la page, capturés en image pour le PDF. */
  charts: DashboardChart[]
}

type Cell = string | number | null
type Format = "int" | "pct" | "dec" | "text"

interface Kpi {
  groupe: string
  label: string
  value: number | null
  format: Format
  detail: string
}

/* --- Formatage -------------------------------------------------------------- */

const ratio = (part: number, total: number) => (total > 0 ? part / total : 0)

/** Nombres « à la française » avec espaces simples (les espaces fines ne passent pas dans les polices PDF standard). */
const nf = (n: number, digits = 0) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: digits }).replace(/[  ]/g, " ")

const pf = (fraction: number) => `${nf(Math.round(fraction * 1000) / 10, 1)} %`

function cellText(value: Cell, format: Format): string {
  if (value === null || value === undefined) return "Non renseigné"
  if (typeof value === "string") return value
  if (format === "pct") return pf(value)
  if (format === "dec") return nf(value, 1)
  return nf(value)
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function filtersText(input: DashboardExportInput) {
  const search = input.query.trim() ? `« ${input.query.trim()} »` : "aucune"
  return `Répartition par ${input.dimensionLabel.toLowerCase()} · recherche : ${search}`
}

function generatedText(data: DashboardData) {
  return new Date(data.genereLe).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }).replace(/[  ]/g, " ")
}

/* --- Contenu commun Excel / PDF --------------------------------------------- */

function buildKpis(data: DashboardData): Kpi[] {
  const f = data.fosas
  const d = deriveDashboard(data)
  return [
    { groupe: "FOSA", label: "FOSA recensées", value: f.total, format: "int", detail: `${nf(f.ouvertes)} ouvertes · ${nf(f.fermees)} fermées` },
    { groupe: "FOSA", label: "Taux d'ouverture", value: ratio(f.ouvertes, f.total), format: "pct", detail: `${nf(f.fermees)} FOSA fermées` },
    { groupe: "FOSA", label: "FOSA électrifiées", value: ratio(f.electrifiees, f.total), format: "pct", detail: `${nf(f.electrifiees)} déclarées raccordées au réseau` },
    { groupe: "FOSA", label: "Sécurisation foncière", value: ratio(f.securisees, f.total), format: "pct", detail: `titre foncier + clôture · ${nf(f.securisees)}` },
    {
      groupe: "FOSA",
      label: "Capacité litière",
      value: f.lits > 0 ? f.lits : null,
      format: "int",
      detail: f.lits > 0 ? `${nf(d.litsParFosa, 1)} lits / FOSA ouverte` : "non renseignée dans la base",
    },
    { groupe: "FOSA", label: "Géolocalisation", value: ratio(f.geolocalisees, f.total), format: "pct", detail: `${nf(f.total - f.geolocalisees)} sans coordonnées` },
    { groupe: "Ressources", label: "Équipements biomédicaux", value: data.equipements.biomedicaux, format: "int", detail: `${nf(data.equipements.autres)} autres équipements` },
    {
      groupe: "Ressources",
      label: "Matériel roulant",
      value: data.vehicules.total,
      format: "int",
      detail: data.vehicules.parEtat[0] ? `principal état : ${data.vehicules.parEtat[0].label.toLowerCase()}` : "aucun véhicule",
    },
    {
      groupe: "Alertes",
      label: "Maintenance prioritaire",
      value: d.maintenance,
      format: "int",
      detail: `${nf(f.maintenance_urgente)} urgentes · ${nf(f.inspections_en_retard)} inspections en retard`,
    },
  ]
}

interface Table {
  /** Nom de feuille Excel (31 caractères max). */
  sheet: string
  title: string
  columns: { header: string; format: Format; width?: number }[]
  rows: Cell[][]
}

function buildTables(input: DashboardExportInput): Table[] {
  const { data } = input
  const f = data.fosas
  const d = deriveDashboard(data)
  const breakdownTotal = input.breakdown.reduce((acc, row) => acc + row.value, 0)

  // Lignes « libellé / FOSA / ouvertes / taux / part » (ouvertes absent = non renseigné)
  const simple = (rows: { label: string; total: number; ouvertes?: number }[], total: number): Cell[][] =>
    rows.map((row) => [
      row.label,
      row.total,
      row.ouvertes ?? null,
      row.ouvertes !== undefined ? ratio(row.ouvertes, row.total) : null,
      ratio(row.total, total),
    ])

  const breakdownCols = (label: string) => [
    { header: label, format: "text" as Format, width: 34 },
    { header: "FOSA", format: "int" as Format },
    { header: "Ouvertes", format: "int" as Format },
    { header: "Taux d'ouverture", format: "pct" as Format },
    { header: "Part du total", format: "pct" as Format },
  ]

  const tables: Table[] = [
    {
      sheet: "Répartition (vue)",
      title: `Répartition des FOSA par ${input.dimensionLabel.toLowerCase()} (vue filtrée)`,
      columns: [{ header: "Rang", format: "int" }, ...breakdownCols(input.dimensionLabel)],
      rows: input.breakdown.map((row, index) => [
        index + 1,
        row.label,
        row.value,
        row.ouvertes ?? null,
        row.ouvertes !== undefined ? ratio(row.ouvertes, row.value) : null,
        ratio(row.value, breakdownTotal),
      ]),
    },
    {
      sheet: "Couverture régionale",
      title: "Couverture régionale",
      columns: [
        { header: "Région", format: "text", width: 22 },
        { header: "FOSA", format: "int" },
        { header: "Ouvertes", format: "int" },
        { header: "% ouvertes", format: "pct" },
        { header: "Électrifiées", format: "int" },
        { header: "% électrifiées", format: "pct" },
        { header: "Sécurisées", format: "int" },
        { header: "% sécurisées", format: "pct" },
        { header: "Lits", format: "int" },
      ],
      rows: data.parRegion.map((r) => [
        r.region,
        r.total,
        r.ouvertes,
        ratio(r.ouvertes, r.total),
        r.electrifiees,
        ratio(r.electrifiees, r.total),
        r.securisees,
        ratio(r.securisees, r.total),
        r.lits,
      ]),
    },
    { sheet: "Par type", title: "FOSA par type", columns: breakdownCols("Type"), rows: simple(data.parType, f.total) },
    { sheet: "Par statut", title: "FOSA par statut", columns: breakdownCols("Statut"), rows: simple(data.parStatut, f.total) },
    { sheet: "Par catégorie", title: "FOSA par catégorie", columns: breakdownCols("Catégorie"), rows: simple(data.parCategorie, f.total) },
    {
      sheet: "Sécurisation foncière",
      title: "Sécurisation foncière (titre foncier et clôture)",
      columns: [
        { header: "Situation", format: "text", width: 30 },
        { header: "FOSA", format: "int" },
        { header: "Part", format: "pct" },
      ],
      rows: [
        ["Titre foncier et clôture", f.securisees, ratio(f.securisees, f.total)],
        ["Titre foncier seul", d.tfSeul, ratio(d.tfSeul, f.total)],
        ["Clôture seule", d.clotureSeule, ratio(d.clotureSeule, f.total)],
        ["Ni l'un ni l'autre", d.aucune, ratio(d.aucune, f.total)],
      ],
    },
    {
      sheet: "Patrimoine bâti",
      title: `Patrimoine bâti : ${nf(data.batiments.total)} bâtiments · ${nf(data.batiments.superficie)} m²`,
      columns: [
        { header: "État", format: "text", width: 24 },
        { header: "Bâtiments", format: "int" },
        { header: "Part", format: "pct" },
      ],
      rows: data.batiments.parEtat.map((r) => [r.label, r.total, ratio(r.total, data.batiments.total)]),
    },
    {
      sheet: "Matériel roulant",
      title: `Matériel roulant : ${nf(data.vehicules.total)} véhicules`,
      columns: [
        { header: "Critère", format: "text", width: 12 },
        { header: "Valeur", format: "text", width: 24 },
        { header: "Véhicules", format: "int" },
        { header: "Part", format: "pct" },
      ],
      rows: [
        ...data.vehicules.parEtat.map((r): Cell[] => ["État", r.label, r.total, ratio(r.total, data.vehicules.total)]),
        ...data.vehicules.parEnergie.map((r): Cell[] => ["Énergie", r.label, r.total, ratio(r.total, data.vehicules.total)]),
      ],
    },
    {
      sheet: "Équipements",
      title: "Équipements",
      columns: [
        { header: "Type", format: "text", width: 28 },
        { header: "Nombre", format: "int" },
      ],
      rows: [
        ["Équipements biomédicaux", data.equipements.biomedicaux],
        ["Autres équipements", data.equipements.autres],
      ],
    },
  ]

  return tables
}

/* --- Excel ------------------------------------------------------------------ */

export async function exportDashboardExcel(input: DashboardExportInput): Promise<string> {
  const XLSX = await import("xlsx")
  const wb = XLSX.utils.book_new()
  const exportedAt = new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })
  const preamble: Cell[][] = [
    ["MINSANTÉ · Tableau de bord des formations sanitaires"],
    [`Exporté le ${exportedAt} · indicateurs calculés le ${generatedText(input.data)}`],
    [`Filtres actifs : ${filtersText(input)}`],
    [],
  ]

  const numberFormat = (format: Format) => (format === "pct" ? "0.0%" : format === "dec" ? "0.0" : format === "int" ? "#,##0" : undefined)

  const addSheet = (name: string, title: string, columns: { header: string; format: Format; width?: number }[], rows: Cell[][]) => {
    const aoa: Cell[][] = [[title], ...preamble.slice(1), columns.map((c) => c.header), ...(rows.length ? rows : [["Aucune donnée"]])]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    const headerRow = preamble.length // index 0-based de la ligne d'en-têtes
    rows.forEach((row, r) =>
      row.forEach((value, c) => {
        const z = numberFormat(columns[c]?.format ?? "text")
        const ref = XLSX.utils.encode_cell({ r: headerRow + 1 + r, c })
        if (z && typeof value === "number" && ws[ref]) ws[ref].z = z
      }),
    )
    ws["!cols"] = columns.map((c) => ({ wch: c.width ?? Math.max(12, c.header.length + 2) }))
    if (rows.length) {
      ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: headerRow, c: 0 }, e: { r: headerRow + rows.length, c: columns.length - 1 } }) }
    }
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
  }

  // Synthèse : en-tête, filtres et indicateurs clés
  const kpis = buildKpis(input.data)
  const summary: Cell[][] = [
    ...preamble,
    ["Source : base MINSANTÉ, via l'API /statistics/dashboard"],
    ["Signature : MINSANTÉ · IMMOSANTECam — conçu et développé par GENEX"],
    [],
    ["Groupe", "Indicateur", "Valeur", "Détail"],
    ...kpis.map((k): Cell[] => [k.groupe, k.label, k.value === null ? "Non renseignée" : k.value, k.detail]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(summary)
  const first = summary.length - kpis.length
  kpis.forEach((k, i) => {
    const ref = XLSX.utils.encode_cell({ r: first + i, c: 2 })
    const z = numberFormat(k.format)
    if (z && typeof k.value === "number" && ws[ref]) ws[ref].z = z
  })
  ws["!cols"] = [{ wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, ws, "Synthèse")

  for (const table of buildTables(input)) addSheet(table.sheet, table.title, table.columns, table.rows)

  const filename = `tableau-de-bord-minsante_${today()}.xlsx`
  XLSX.writeFile(wb, filename)
  return filename
}

/* --- PDF -------------------------------------------------------------------- */

const NAVY: [number, number, number] = [0, 55, 88]
const BRAND: [number, number, number] = [0, 122, 195]
const GRAY: [number, number, number] = [100, 116, 139]
const INK: [number, number, number] = [17, 24, 39]

/**
 * Capture d'un bloc de la page en JPEG (bien plus léger que le PNG dans le PDF).
 * Pas de cacheBust : le paramètre ajouté aux URL casse le chargement des
 * polices Google, et le texte capturé retomberait sur une police de secours.
 */
const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

let fontCssPromise: Promise<string | undefined> | null = null

/**
 * @font-face des polices de l'application (Google Fonts), avec les fichiers
 * woff2 en data URL. html-to-image ne peut pas lire la feuille cross-origin
 * lui-même : sans cela, le texte capturé passe en police de secours, plus
 * large, et se chevauche. Sous-ensemble latin uniquement (français).
 */
function fontEmbedCss(): Promise<string | undefined> {
  fontCssPromise ??= (async () => {
    const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href*="fonts.googleapis.com"]')]
    if (!links.length) return undefined
    const sheets = await Promise.all(links.map((link) => fetch(link.href).then((r) => (r.ok ? r.text() : ""))))
    const blocks = sheets.join("\n").match(/@font-face\s*{[^}]*}/g) ?? []
    const latin = blocks.filter((block) => /unicode-range:[^;]*U\+0000-00FF/i.test(block))
    const embedded = await Promise.all(
      latin.map(async (block) => {
        const url = block.match(/url\(([^)]+)\)/)?.[1]?.replace(/["']/g, "")
        if (!url) return block
        const data = await fetch(url).then((r) => r.blob()).then(blobToDataUrl)
        return block.replace(/url\([^)]+\)/, `url(${data})`)
      }),
    )
    return embedded.join("\n") || undefined
  })().catch(() => undefined)
  return fontCssPromise
}

async function captureChart(node: HTMLElement): Promise<{ dataUrl: string; ratio: number } | null> {
  const { toJpeg } = await import("html-to-image")
  const width = node.offsetWidth
  const height = node.offsetHeight
  if (!width || !height) return null
  const fontEmbedCSS = await fontEmbedCss()
  // margin: 0 : le bloc hérite d'un margin-top (space-y-*) qui décalerait la capture.
  const options = { pixelRatio: 2, quality: 0.9, backgroundColor: "#ffffff", style: { margin: "0" }, ...(fontEmbedCSS ? { fontEmbedCSS } : {}) }
  try {
    return { dataUrl: await toJpeg(node, options), ratio: height / width }
  } catch {
    // Polices distantes non embarquables : nouvelle tentative sans les polices web.
    try {
      return { dataUrl: await toJpeg(node, { ...options, skipFonts: true }), ratio: height / width }
    } catch {
      return null
    }
  }
}

export async function exportDashboardPdf(input: DashboardExportInput): Promise<string> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([import("jspdf"), import("jspdf-autotable")])
  const autoTable = autoTableModule.default
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 14
  const TOP = 30
  const BOTTOM = H - 16
  let y = TOP

  const ensure = (height: number) => {
    if (y + height > BOTTOM) {
      doc.addPage()
      y = TOP
    }
  }

  const heading = (text: string) => {
    ensure(14)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(...INK)
    doc.text(text, M, y)
    doc.setDrawColor(...BRAND)
    doc.setLineWidth(0.6)
    doc.line(M, y + 1.6, M + 12, y + 1.6)
    y += 6
  }

  // Métadonnées
  const exportedAt = new Date().toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }).replace(/[  ]/g, " ")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text(`Exporté le ${exportedAt}`, M, y)
  doc.text(`Indicateurs calculés le ${generatedText(input.data)}`, W - M, y, { align: "right" })
  y += 5
  doc.setTextColor(...INK)
  doc.setFont("helvetica", "bold")
  doc.text("Filtres actifs :", M, y)
  doc.setFont("helvetica", "normal")
  doc.text(filtersText(input), M + 24, y)
  y += 8

  // Indicateurs clés
  heading("Indicateurs clés")
  const kpis = buildKpis(input.data)
  const cols = 3
  const gap = 4
  const boxW = (W - 2 * M - gap * (cols - 1)) / cols
  const boxH = 19
  kpis.forEach((k, i) => {
    const col = i % cols
    if (col === 0) ensure(boxH + gap)
    const x = M + col * (boxW + gap)
    doc.setFillColor(246, 248, 250)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.2)
    doc.roundedRect(x, y, boxW, boxH, 2, 2, "FD")
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.5)
    doc.setTextColor(...GRAY)
    doc.text(k.label.toUpperCase(), x + 3, y + 5)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(...INK)
    doc.text(k.value === null ? "—" : cellText(k.value, k.format), x + 3, y + 11.5)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.5)
    doc.setTextColor(...GRAY)
    doc.text(doc.splitTextToSize(k.detail, boxW - 6)[0] ?? "", x + 3, y + 16)
    if (col === cols - 1 || i === kpis.length - 1) y += boxH + gap
  })
  y += 2

  // Graphiques (captures des blocs de la page)
  const charts = input.charts.filter((c) => c.node)
  if (charts.length) {
    heading("Graphiques")
    const halfW = (W - 2 * M - gap) / 2
    let column = 0
    let rowHeight = 0
    for (const chart of charts) {
      const image = await captureChart(chart.node as HTMLElement)
      if (!image) continue
      if (chart.span === "full") {
        if (column === 1) {
          y += rowHeight + gap
          column = 0
          rowHeight = 0
        }
        let w = W - 2 * M
        let h = w * image.ratio
        const maxH = BOTTOM - TOP
        if (h > maxH) {
          h = maxH
          w = h / image.ratio
        }
        ensure(h)
        doc.addImage(image.dataUrl, "JPEG", M, y, w, h, undefined, "FAST")
        y += h + gap
      } else {
        const h = halfW * image.ratio
        if (column === 0) {
          ensure(h)
          doc.addImage(image.dataUrl, "JPEG", M, y, halfW, h, undefined, "FAST")
          rowHeight = h
          column = 1
        } else {
          if (y + h > BOTTOM) {
            y += rowHeight + gap
            ensure(h)
            doc.addImage(image.dataUrl, "JPEG", M, y, halfW, h, undefined, "FAST")
            rowHeight = h
            column = 1
            continue
          }
          doc.addImage(image.dataUrl, "JPEG", M + halfW + gap, y, halfW, h, undefined, "FAST")
          y += Math.max(rowHeight, h) + gap
          column = 0
          rowHeight = 0
        }
      }
    }
    if (column === 1) y += rowHeight + gap
  }

  // Tableaux
  for (const table of buildTables(input)) {
    heading(table.title)
    const rows = table.rows.length ? table.rows : [["Aucune donnée", ...table.columns.slice(1).map(() => "")]]
    autoTable(doc, {
      startY: y,
      head: [table.columns.map((c) => c.header)],
      body: rows.map((row) => row.map((value, c) => (table.rows.length ? cellText(value, table.columns[c]?.format ?? "text") : String(value ?? "")))),
      margin: { left: M, right: M, top: TOP, bottom: H - BOTTOM },
      styles: { font: "helvetica", fontSize: 8, cellPadding: 1.6, textColor: INK, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: [223, 230, 238], textColor: [63, 81, 101], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [246, 248, 250] },
      columnStyles: Object.fromEntries(table.columns.map((c, i) => [i, { halign: c.format === "text" ? "left" : "right" }])),
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // En-tête et pied de page sur toutes les pages
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, W, 22, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.text("MINSANTÉ · IMMOSANTECam", M, 8.5)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.text("Tableau de bord des formations sanitaires", M, 15.5)

    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.2)
    doc.line(M, H - 11, W - M, H - 11)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY)
    doc.text("MINSANTÉ · Données issues de la base des formations sanitaires · Réalisation GENEX", M, H - 6.5)
    doc.text(`Page ${i} / ${pages}`, W - M, H - 6.5, { align: "right" })
  }

  const filename = `tableau-de-bord-minsante_${today()}.pdf`
  doc.save(filename)
  return filename
}
