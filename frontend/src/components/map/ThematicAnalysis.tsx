// ThematicAnalysis.tsx
import React, { useState, useMemo } from 'react';
import { Layers, TrendingUp, Shield, Fence, Home } from 'lucide-react';

export interface ThematicTheme {
  id: string;
  name: string;
  description: string;
  getColor: (value: string) => string;
  icon: React.ReactNode;
}

interface ThematicAnalysisProps {
  districtsData: any[];
  airesantesData: any[];
  fosasData: any[];
  onThemeChange: (theme: ThematicTheme | null) => void;
}

const ThematicAnalysis: React.FC<ThematicAnalysisProps> = ({
  districtsData,
  airesantesData,
  fosasData,
  onThemeChange,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('');

  // Calcul des statistiques pour les titres fonciers
  const titreFoncierStats = useMemo(() => {
    if (!fosasData.length) return {};

    const stats: any = {};

    // Par district
    districtsData.forEach(district => {
      const districtFosas = fosasData.filter(fosa =>
        fosa.district?.id === district.id ||
        fosa.district?.nom === district.nom ||
        fosa.district?.nom_ds === district.nom_ds
      );

      const withTitreFoncier = districtFosas.filter(fosa =>
        fosa.aTitreFoncier === true || fosa.aTitreFoncier === 1
      ).length;

      const percentage = districtFosas.length > 0
        ? Math.round((withTitreFoncier / districtFosas.length) * 100)
        : 0;

      const districtName = district.nom_ds || district.nom;
      stats[districtName] = {
        total: districtFosas.length,
        withTitreFoncier,
        percentage
      };
    });

    return stats;
  }, [fosasData, districtsData]);

  // Calcul des statistiques pour les clôtures
  const clotureStats = useMemo(() => {
    if (!fosasData.length) return {};

    const stats: any = {};

    // Par district
    districtsData.forEach(district => {
      const districtFosas = fosasData.filter(fosa =>
        fosa.district?.id === district.id ||
        fosa.district?.nom === district.nom ||
        fosa.district?.nom_ds === district.nom_ds
      );

      const withCloture = districtFosas.filter(fosa =>
        fosa.aCloture === true || fosa.aCloture === 1
      ).length;

      const percentage = districtFosas.length > 0
        ? Math.round((withCloture / districtFosas.length) * 100)
        : 0;

      const districtName = district.nom_ds || district.nom;
      stats[districtName] = {
        total: districtFosas.length,
        withCloture,
        percentage
      };
    });

    return stats;
  }, [fosasData, districtsData]);

  // Calcul des statistiques par type de FOSA
  const typeStats = useMemo(() => {
    if (!fosasData.length) return {};

    const stats: any = {};

    districtsData.forEach(district => {
      const districtFosas = fosasData.filter(fosa =>
        fosa.district?.id === district.id ||
        fosa.district?.nom === district.nom ||
        fosa.district?.nom_ds === district.nom_ds
      );

      const typesCount: any = {};
      districtFosas.forEach(fosa => {
        const type = fosa.type || fosa.catRec || 'Non spécifié';
        typesCount[type] = (typesCount[type] || 0) + 1;
      });

      const districtName = district.nom_ds || district.nom;
      stats[districtName] = {
        total: districtFosas.length,
        types: typesCount
      };
    });

    return stats;
  }, [fosasData, districtsData]);

  // Thèmes disponibles
  const themes: ThematicTheme[] = [
    {
      id: 'titre-foncier',
      name: 'Titres Fonciers',
      description: 'Pourcentage de FOSA avec titre foncier par district',
      getColor: (districtName: string) => {
        const stats = titreFoncierStats[districtName];
        if (!stats || stats.total === 0) return '#e5e7eb';

        if (stats.percentage >= 80) return '#10b981'; // Vert
        if (stats.percentage >= 50) return '#f59e0b'; // Jaune
        if (stats.percentage >= 20) return '#f97316'; // Orange
        return '#ef4444'; // Rouge
      },
      icon: <Home className="w-4 h-4" />
    },
    {
      id: 'cloture',
      name: 'Clôtures',
      description: 'Pourcentage de FOSA avec clôture par district',
      getColor: (districtName: string) => {
        const stats = clotureStats[districtName];
        if (!stats || stats.total === 0) return '#e5e7eb';

        if (stats.percentage >= 80) return '#10b981';
        if (stats.percentage >= 50) return '#f59e0b';
        if (stats.percentage >= 20) return '#f97316';
        return '#ef4444';
      },
      icon: <Fence className="w-4 h-4" />
    },
    {
      id: 'type-fosa',
      name: 'Types de FOSA',
      description: 'Répartition des types de formations sanitaires',
      getColor: (districtName: string) => {
        const stats = typeStats[districtName];
        if (!stats || stats.total === 0) return '#e5e7eb';

        // Couleur basée sur la diversité des types
        const typeCount = Object.keys(stats.types || {}).length;
        if (typeCount >= 5) return '#8b5cf6'; // Violet
        if (typeCount >= 3) return '#3b82f6'; // Bleu
        if (typeCount >= 2) return '#06b6d4'; // Cyan
        return '#6366f1'; // Indigo
      },
      icon: <TrendingUp className="w-4 h-4" />
    }
  ];

  const handleThemeChange = (themeId: string) => {
    if (themeId === selectedTheme) {
      setSelectedTheme('');
      onThemeChange(null);
    } else {
      const theme = themes.find(t => t.id === themeId);
      setSelectedTheme(themeId);
      onThemeChange(theme || null);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-emerald-200 max-w-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Layers className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-gray-800 text-sm">Analyse Thématique</h3>
      </div>

      <div className="space-y-3">
        {themes.map(theme => (
          <div key={theme.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => handleThemeChange(theme.id)}
              className={`w-full p-3 text-left transition-colors ${selectedTheme === theme.id
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white hover:bg-gray-50'
                } border-b border-gray-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-1 rounded ${selectedTheme === theme.id ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {theme.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{theme.name}</div>
                    <div className="text-xs text-gray-500">{theme.description}</div>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full border-2 ${selectedTheme === theme.id
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-white border-gray-300'
                  }`} />
              </div>
            </button>

            {selectedTheme === theme.id && (
              <div className="p-3 bg-gray-50 max-h-48 overflow-y-auto">
                <div className="space-y-2 text-xs">
                  {Object.entries(
                    theme.id === 'titre-foncier' ? titreFoncierStats :
                      theme.id === 'cloture' ? clotureStats :
                        typeStats
                  ).map(([districtName, stats]: [string, any]) => (
                    <div key={districtName} className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 truncate flex-1 mr-2">
                        {districtName}
                      </span>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {theme.id === 'titre-foncier' && (
                          <span className="text-gray-600">
                            {stats.withTitreFoncier || 0}/{stats.total || 0}
                          </span>
                        )}
                        {theme.id === 'cloture' && (
                          <span className="text-gray-600">
                            {stats.withCloture || 0}/{stats.total || 0}
                          </span>
                        )}
                        {theme.id === 'type-fosa' && (
                          <span className="text-gray-600">
                            {Object.keys(stats.types || {}).length} types
                          </span>
                        )}
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: theme.getColor(districtName) }}
                        />
                      </div>
                    </div>
                  ))}

                  {Object.keys(
                    theme.id === 'titre-foncier' ? titreFoncierStats :
                      theme.id === 'cloture' ? clotureStats :
                        typeStats
                  ).length === 0 && (
                      <div className="text-center text-gray-500 py-2">
                        Aucune donnée disponible
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedTheme && (
        <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-medium">Légende:</span>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded"></div>
                <span>Élevé</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded"></div>
                <span>Moyen</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded"></div>
                <span>Faible</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThematicAnalysis;