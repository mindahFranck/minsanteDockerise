import * as turf from '@turf/turf';

/**
 * Calcule la superficie d'un polygone en km²
 */
export function calculateArea(geometry: any): number {
  try {
    if (!geometry || !geometry.coordinates) return 0;

    const polygon = turf.polygon(geometry.coordinates);
    const area = turf.area(polygon);
    // Convertir m² en km²
    return area / 1000000;
  } catch (error) {
    console.error('Erreur calcul superficie:', error);
    return 0;
  }
}

/**
 * Calcule le centroïde d'un polygone
 */
export function calculateCentroid(geometry: any): [number, number] | null {
  try {
    if (!geometry || !geometry.coordinates) return null;

    const polygon = turf.polygon(geometry.coordinates);
    const centroid = turf.centroid(polygon);
    return centroid.geometry.coordinates as [number, number];
  } catch (error) {
    console.error('Erreur calcul centroïde:', error);
    return null;
  }
}

/**
 * Calcule la distance entre deux points en km
 */
export function calculateDistance(point1: [number, number], point2: [number, number]): number {
  try {
    const from = turf.point(point1);
    const to = turf.point(point2);
    return turf.distance(from, to, { units: 'kilometers' });
  } catch (error) {
    console.error('Erreur calcul distance:', error);
    return 0;
  }
}

/**
 * Vérifie si un point est dans un polygone
 */
export function pointInPolygon(point: [number, number], geometry: any): boolean {
  try {
    if (!geometry || !geometry.coordinates) return false;

    const pt = turf.point(point);
    const poly = turf.polygon(geometry.coordinates);
    return turf.booleanPointInPolygon(pt, poly);
  } catch (error) {
    console.error('Erreur point in polygon:', error);
    return false;
  }
}

/**
 * Calcule le buffer autour d'un point (rayon en km)
 */
export function createBuffer(point: [number, number], radius: number): any {
  try {
    const pt = turf.point(point);
    const buffered = turf.buffer(pt, radius, { units: 'kilometers' });
    return buffered?.geometry;
  } catch (error) {
    console.error('Erreur création buffer:', error);
    return null;
  }
}

/**
 * Trouve les points les plus proches dans un rayon donné
 */
export function findNearbyPoints(
  centerPoint: [number, number],
  allPoints: Array<{ coords: [number, number]; data: any }>,
  maxDistance: number
): Array<{ coords: [number, number]; data: any; distance: number }> {
  try {
    const center = turf.point(centerPoint);

    return allPoints
      .map(item => {
        const pt = turf.point(item.coords);
        const distance = turf.distance(center, pt, { units: 'kilometers' });
        return { ...item, distance };
      })
      .filter(item => item.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Erreur recherche points proches:', error);
    return [];
  }
}

/**
 * Calcule la densité (nombre d'éléments par km²)
 */
export function calculateDensity(count: number, area: number): number {
  if (area === 0) return 0;
  return count / area;
}

/**
 * Crée une grille hexagonale pour l'analyse de densité
 */
export function createHexGrid(bbox: number[], cellSize: number): any {
  try {
    return turf.hexGrid(bbox, cellSize, { units: 'kilometers' });
  } catch (error) {
    console.error('Erreur création grille hex:', error);
    return null;
  }
}

/**
 * Agrège des points dans des polygones (ex: compte FOSA par district)
 */
export function aggregatePointsInPolygons(
  points: Array<[number, number]>,
  polygons: Array<{ geometry: any; id: string }>
): Map<string, number> {
  const counts = new Map<string, number>();

  polygons.forEach(poly => counts.set(poly.id, 0));

  points.forEach(point => {
    polygons.forEach(poly => {
      if (pointInPolygon(point, poly.geometry)) {
        counts.set(poly.id, (counts.get(poly.id) || 0) + 1);
      }
    });
  });

  return counts;
}

/**
 * Calcule les statistiques de distance moyenne entre points
 */
export function calculateAverageDistance(points: Array<[number, number]>): number {
  if (points.length < 2) return 0;

  let totalDistance = 0;
  let count = 0;

  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 1; j < points.length; j++) {
      totalDistance += calculateDistance(points[i], points[j]);
      count++;
    }
  }

  return count > 0 ? totalDistance / count : 0;
}

/**
 * Trouve le point le plus proche d'un point donné
 */
export function findNearestPoint(
  targetPoint: [number, number],
  points: Array<{ coords: [number, number]; data: any }>
): { coords: [number, number]; data: any; distance: number } | null {
  if (points.length === 0) return null;

  let nearest = points[0];
  let minDistance = calculateDistance(targetPoint, nearest.coords);

  points.slice(1).forEach(point => {
    const distance = calculateDistance(targetPoint, point.coords);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = point;
    }
  });

  return { ...nearest, distance: minDistance };
}

/**
 * Calcule le périmètre d'un polygone en km
 */
export function calculatePerimeter(geometry: any): number {
  try {
    if (!geometry || !geometry.coordinates) return 0;

    const polygon = turf.polygon(geometry.coordinates);
    const length = turf.length(polygon, { units: 'kilometers' });
    return length;
  } catch (error) {
    console.error('Erreur calcul périmètre:', error);
    return 0;
  }
}

/**
 * Analyse thématique - Classification des polygones par valeur
 */
export function classifyByValue(
  items: Array<{ id: string; value: number }>,
  numClasses: number = 5
): Map<string, number> {
  const values = items.map(item => item.value).sort((a, b) => a - b);
  const classification = new Map<string, number>();

  if (values.length === 0) return classification;

  const min = values[0];
  const max = values[values.length - 1];
  const range = max - min;
  const classSize = range / numClasses;

  items.forEach(item => {
    if (classSize === 0) {
      classification.set(item.id, 0);
    } else {
      const classIndex = Math.min(
        Math.floor((item.value - min) / classSize),
        numClasses - 1
      );
      classification.set(item.id, classIndex);
    }
  });

  return classification;
}

/**
 * Génère une palette de couleurs pour la cartographie thématique
 */
export function getColorPalette(type: 'sequential' | 'diverging' | 'qualitative', numColors: number = 5): string[] {
  const palettes = {
    sequential: [
      '#ffffcc',
      '#c7e9b4',
      '#7fcdbb',
      '#41b6c4',
      '#1d91c0',
      '#225ea8',
      '#0c2c84'
    ],
    diverging: [
      '#d73027',
      '#fc8d59',
      '#fee090',
      '#ffffbf',
      '#e0f3f8',
      '#91bfdb',
      '#4575b4'
    ],
    qualitative: [
      '#e41a1c',
      '#377eb8',
      '#4daf4a',
      '#984ea3',
      '#ff7f00',
      '#ffff33',
      '#a65628',
      '#f781bf'
    ]
  };

  return palettes[type].slice(0, numColors);
}

/**
 * Calcule les statistiques descriptives pour une série de valeurs
 */
export function calculateStatistics(values: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
} {
  if (values.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;

  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return { min, max, mean, median, stdDev };
}
