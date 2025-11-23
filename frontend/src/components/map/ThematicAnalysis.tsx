import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Map as MapIcon, Layers } from 'lucide-react';
import {
  calculateArea,
  calculateDensity,
  classifyByValue,
  getColorPalette,
  calculateStatistics
} from '../../utils/mapAnalytics';

interface ThematicAnalysisProps {
  districtsData: any[];
  airesantesData: any[];
  fosasData?: any[];
  onThemeChange: (theme: ThematicTheme | null) => void;
}

// Helper function to count FOSAs per district
function countFosasByDistrict(airesantes: any[], fosas: any[]): Map<string, number> {
  const countMap = new Map<string, number>();

  // Group aires de santé by district
  const airesantesByDistrict = new Map<number, string>();
  airesantes.forEach((aire: any) => {
    if (aire.nom_dist) {
      airesantesByDistrict.set(aire.id, aire.nom_dist);
    }
  });

  // Count FOSAs per district
  fosas.forEach((fosa: any) => {
    const districtName = airesantesByDistrict.get(fosa.airesanteId);
    if (districtName) {
      countMap.set(districtName, (countMap.get(districtName) || 0) + 1);
    }
  });

  return countMap;
}

export type ThematicTheme = {
  type: 'density' | 'area' | 'count' | 'custom';
  title: string;
  colorScale: string[];
  getColor: (id: string) => string;
  legend: { label: string; color: string }[];
  statistics?: any;
};

export default function ThematicAnalysis({
  districtsData,
  airesantesData,
  fosasData = [],
  onThemeChange
}: ThematicAnalysisProps) {
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);

  // Analyse de densité FOSA par district
  const analyzeFosaDensity = () => {
    const densityMap = new Map<string, number>();
    const areaMap = new Map<string, number>();

    // Calculer les superficies
    districtsData.forEach((district: any) => {
      if (district.geom) {
        const area = calculateArea(district.geom);
        areaMap.set(district.nom_ds || district.id.toString(), area);
      }
    });

    // Compter les FOSA par district
    const fosaCountMap = fosasData && fosasData.length > 0
      ? countFosasByDistrict(airesantesData, fosasData)
      : new Map<string, number>();

    // Calculer la densité
    districtsData.forEach((district: any) => {
      const districtName = district.nom_ds || district.id.toString();
      const area = areaMap.get(districtName) || 1;
      const count = fosaCountMap.get(districtName) || 0;
      const density = calculateDensity(count, area);
      densityMap.set(districtName, density);
    });

    // Classification
    const items = Array.from(densityMap.entries()).map(([id, value]) => ({ id, value }));
    const classes = classifyByValue(items, 5);
    const colors = getColorPalette('sequential', 5);

    // Calculer les valeurs min/max de chaque classe
    const classBounds = Array.from({ length: 5 }, (_, idx) => {
      const classItems = items.filter(item => classes.get(item.id) === idx);
      if (classItems.length === 0) return { min: 0, max: 0 };
      return {
        min: Math.min(...classItems.map(i => i.value)),
        max: Math.max(...classItems.map(i => i.value))
      };
    });

    const theme: ThematicTheme = {
      type: 'density',
      title: 'Densité de FOSA par District',
      colorScale: colors,
      getColor: (id: string) => {
        const classIndex = classes.get(id) || 0;
        return colors[classIndex] || colors[0];
      },
      legend: colors.map((color, idx) => ({
        label: `${classBounds[idx].min.toFixed(2)} - ${classBounds[idx].max.toFixed(2)} FOSA/km²`,
        color
      })),
      statistics: calculateStatistics(Array.from(densityMap.values()))
    };

    setActiveTheme('density');
    setStatistics(theme.statistics);
    onThemeChange(theme);
  };

  // Analyse de superficie
  const analyzeArea = () => {
    const areaMap = new Map<string, number>();

    districtsData.forEach((district: any) => {
      if (district.geom) {
        const area = calculateArea(district.geom);
        areaMap.set(district.nom_ds || district.id.toString(), area);
      }
    });

    const items = Array.from(areaMap.entries()).map(([id, value]) => ({ id, value }));
    const classes = classifyByValue(items, 5);
    const colors = getColorPalette('sequential', 5);

    // Calculer les valeurs min/max de chaque classe
    const classBounds = Array.from({ length: 5 }, (_, idx) => {
      const classItems = items.filter(item => classes.get(item.id) === idx);
      if (classItems.length === 0) return { min: 0, max: 0 };
      return {
        min: Math.min(...classItems.map(i => i.value)),
        max: Math.max(...classItems.map(i => i.value))
      };
    });

    const theme: ThematicTheme = {
      type: 'area',
      title: 'Superficie des Districts (km²)',
      colorScale: colors,
      getColor: (id: string) => {
        const classIndex = classes.get(id) || 0;
        return colors[classIndex] || colors[0];
      },
      legend: colors.map((color, idx) => ({
        label: `${classBounds[idx].min.toFixed(0)} - ${classBounds[idx].max.toFixed(0)} km²`,
        color
      })),
      statistics: calculateStatistics(Array.from(areaMap.values()))
    };

    setActiveTheme('area');
    setStatistics(theme.statistics);
    onThemeChange(theme);
  };

  // Analyse du nombre d'aires de santé par district
  const analyzeAiresCount = () => {
    const countMap = new Map<string, number>();

    // Initialiser les compteurs
    districtsData.forEach((district: any) => {
      countMap.set(district.nom_ds || district.id.toString(), 0);
    });

    // Compter les aires de santé par district
    airesantesData.forEach((aire: any) => {
      districtsData.forEach((district: any) => {
        // Vérifier si l'aire appartient au district (basé sur districtId ou nom)
        if (aire.districtId === district.id || aire.nom_dist === district.nom_ds) {
          const districtName = district.nom_ds || district.id.toString();
          countMap.set(districtName, (countMap.get(districtName) || 0) + 1);
        }
      });
    });

    const items = Array.from(countMap.entries()).map(([id, value]) => ({ id, value }));
    const classes = classifyByValue(items, 5);
    const colors = getColorPalette('diverging', 5);

    // Calculer les valeurs min/max de chaque classe
    const classBounds = Array.from({ length: 5 }, (_, idx) => {
      const classItems = items.filter(item => classes.get(item.id) === idx);
      if (classItems.length === 0) return { min: 0, max: 0 };
      return {
        min: Math.min(...classItems.map(i => i.value)),
        max: Math.max(...classItems.map(i => i.value))
      };
    });

    const theme: ThematicTheme = {
      type: 'count',
      title: 'Nombre d\'Aires de Santé par District',
      colorScale: colors,
      getColor: (id: string) => {
        const classIndex = classes.get(id) || 0;
        return colors[classIndex] || colors[0];
      },
      legend: colors.map((color, idx) => ({
        label: `${classBounds[idx].min} - ${classBounds[idx].max} aires`,
        color
      })),
      statistics: calculateStatistics(Array.from(countMap.values()))
    };

    setActiveTheme('count');
    setStatistics(theme.statistics);
    onThemeChange(theme);
  };

  const resetTheme = () => {
    setActiveTheme(null);
    setStatistics(null);
    onThemeChange(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Analyses Thématiques
      </h3>

      <div className="space-y-2">
        <button
          onClick={analyzeArea}
          className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
            activeTheme === 'area'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <MapIcon className="w-5 h-5" />
          <div className="text-left">
            <div className="font-medium">Superficie</div>
            <div className="text-xs opacity-80">Taille des districts en km²</div>
          </div>
        </button>

        {activeTheme && (
          <button
            onClick={resetTheme}
            className="w-full px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors font-medium"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Statistiques */}
      {statistics && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-semibold text-gray-800 mb-3">Statistiques</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">Minimum</div>
              <div className="font-semibold">{statistics.min.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">Maximum</div>
              <div className="font-semibold">{statistics.max.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">Moyenne</div>
              <div className="font-semibold">{statistics.mean.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">Médiane</div>
              <div className="font-semibold">{statistics.median.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded col-span-2">
              <div className="text-gray-600">Écart-type</div>
              <div className="font-semibold">{statistics.stdDev.toFixed(2)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
