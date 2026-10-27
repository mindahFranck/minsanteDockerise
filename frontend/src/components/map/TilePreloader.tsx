import { useState } from "react";
import type L from "leaflet";
import { Download, X, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  map: L.Map | null;
  tileUrlTemplate: string;
  /** Niveaux de zoom à pré-télécharger (au-delà du zoom courant) */
  extraZoomLevels?: number;
  className?: string;
}

interface TileCoord {
  x: number;
  y: number;
  z: number;
}

function lonLatToTile(lon: number, lat: number, zoom: number): { x: number; y: number } {
  const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom),
  );
  return { x, y };
}

function buildTilesForBounds(
  bounds: { north: number; south: number; east: number; west: number },
  minZoom: number,
  maxZoom: number,
): TileCoord[] {
  const tiles: TileCoord[] = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    const tl = lonLatToTile(bounds.west, bounds.north, z);
    const br = lonLatToTile(bounds.east, bounds.south, z);
    const xMin = Math.min(tl.x, br.x);
    const xMax = Math.max(tl.x, br.x);
    const yMin = Math.min(tl.y, br.y);
    const yMax = Math.max(tl.y, br.y);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        tiles.push({ x, y, z });
      }
    }
  }
  return tiles;
}

function tileUrl(template: string, t: TileCoord): string {
  // Replace {s} (subdomain) with 'a' to avoid cross-domain caching variations
  return template
    .replace("{s}", "a")
    .replace("{x}", String(t.x))
    .replace("{y}", String(t.y))
    .replace("{z}", String(t.z));
}

const CONCURRENCY = 6;
const TILE_HARD_LIMIT = 4000;

export default function TilePreloader({
  map,
  tileUrlTemplate,
  extraZoomLevels = 2,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const [done, setDone] = useState(false);
  const [estTiles, setEstTiles] = useState(0);

  if (!map) return null;

  const computeEstimate = () => {
    const b = map.getBounds();
    const z = map.getZoom();
    const tiles = buildTilesForBounds(
      {
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      },
      z,
      z + extraZoomLevels,
    );
    setEstTiles(tiles.length);
    return tiles;
  };

  const start = async () => {
    setDone(false);
    let tiles = computeEstimate();
    if (tiles.length > TILE_HARD_LIMIT) {
      tiles = tiles.slice(0, TILE_HARD_LIMIT);
    }
    setRunning(true);
    setProgress({ done: 0, total: tiles.length, errors: 0 });

    let index = 0;
    let ok = 0;
    let errs = 0;
    const worker = async () => {
      while (index < tiles.length) {
        const i = index++;
        const url = tileUrl(tileUrlTemplate, tiles[i]);
        try {
          const res = await fetch(url, { mode: "no-cors", cache: "default" });
          if (res && (res.ok || res.type === "opaque")) ok++;
          else errs++;
        } catch {
          errs++;
        }
        if (i % 5 === 0) {
          setProgress({ done: ok + errs, total: tiles.length, errors: errs });
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
    setProgress({ done: ok + errs, total: tiles.length, errors: errs });
    setRunning(false);
    setDone(true);
  };

  const toggle = () => {
    if (!open) computeEstimate();
    setOpen(!open);
    setDone(false);
  };

  const pct = progress.total
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  return (
    <div className={`absolute z-[1000] ${className || "bottom-8 right-4"}`}>
      {!open && (
        <button
          onClick={toggle}
          title="Précharger les tuiles pour usage hors ligne"
          className="bg-white hover:bg-blue-50 shadow-lg rounded-lg p-3 border border-gray-200 flex items-center gap-2"
        >
          <Download size={18} className="text-blue-600" />
          <span className="text-xs font-medium text-gray-700 hidden sm:inline">
            Hors ligne
          </span>
        </button>
      )}

      {open && (
        <div className="bg-white shadow-2xl rounded-lg border border-gray-200 p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-1">
              <Download size={16} className="text-blue-600" />
              Carte hors ligne
            </h4>
            <button
              onClick={toggle}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-gray-600 mb-3">
            Téléchargez les tuiles de la zone visible pour la consulter sans
            connexion (jusqu'à <strong>{extraZoomLevels} niveaux de zoom</strong>{" "}
            supplémentaires).
          </p>

          <div className="bg-blue-50 rounded p-2 mb-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Tuiles estimées :</span>
              <strong className="text-blue-900">{estTiles.toLocaleString("fr-FR")}</strong>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-gray-600">Taille approx. :</span>
              <strong className="text-blue-900">
                ~{Math.round((estTiles * 15) / 1024)} Mo
              </strong>
            </div>
            {estTiles > TILE_HARD_LIMIT && (
              <div className="mt-2 text-amber-700 flex items-start gap-1">
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                <span>
                  Limité à {TILE_HARD_LIMIT.toLocaleString("fr-FR")} tuiles. Zoomez
                  pour réduire la zone.
                </span>
              </div>
            )}
          </div>

          {running && (
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Téléchargement…</span>
                <span className="font-medium text-blue-700">{pct}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {progress.done} / {progress.total}
                {progress.errors > 0 && (
                  <span className="text-red-500 ml-2">
                    ({progress.errors} erreurs)
                  </span>
                )}
              </div>
            </div>
          )}

          {done && !running && (
            <div className="bg-emerald-50 border border-emerald-200 rounded p-2 mb-3 text-xs flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-600 mt-0.5" />
              <div>
                <strong className="text-emerald-800">Terminé !</strong>
                <p className="text-emerald-700 mt-0.5">
                  {progress.done - progress.errors} tuiles en cache,{" "}
                  {progress.errors} erreurs.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={start}
            disabled={running}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium px-3 py-2 rounded"
          >
            {running ? "En cours…" : done ? "Recommencer" : "Lancer le téléchargement"}
          </button>
        </div>
      )}
    </div>
  );
}
