// ThematicAnalysis.tsx
import React, { useState, useMemo } from 'react';
import { Layers, TrendingUp, Shield, Fence, Home, Zap, Building } from 'lucide-react';

export interface ThematicTheme {
  id: string;
  name: string;
  description: string;
  getColor: (value: any) => string; // ✅ Corrigé: un seul argument
  getValue: (entity: any, entityType: string, getEntityName: (entity: any, type: string) => string) => any; // ✅ Corrigé: trois arguments
  formatValue: (value: any) => string;
  icon: React.ReactNode;
}

interface ThematicAnalysisProps {
  entitiesData: any[];
  fosasData: any[];
  onThemeChange: (theme: ThematicTheme | null) => void;
  entityType: 'region' | 'departement' | 'district' | 'arrondissement' | 'airesante';
}

const ThematicAnalysis: React.FC<ThematicAnalysisProps> = ({
  entitiesData,
  fosasData,
  onThemeChange,
  entityType,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('');

  // Fonction pour trouver les FOSAs d'une entité selon son type
  const getFosasForEntity = (entity: any) => {
    switch (entityType) {
      case 'region':
        return fosasData.filter(fosa =>
          fosa.region?.id === entity.id ||
          fosa.region?.nom === entity.nom
        );
      case 'departement':
        return fosasData.filter(fosa =>
          fosa.departement?.id === entity.id ||
          fosa.departement?.nom === entity.nom
        );
      case 'district':
        return fosasData.filter(fosa =>
          fosa.district?.id === entity.id ||
          fosa.district?.nom === entity.nom ||
          fosa.district?.nom_ds === entity.nom_ds
        );
      case 'arrondissement':
        return fosasData.filter(fosa =>
          fosa.arrondissement?.id === entity.id ||
          fosa.arrondissement?.nom === entity.nom
        );
      case 'airesante':
        return fosasData.filter(fosa =>
          fosa.airesante?.id === entity.id ||
          fosa.airesante?.nom === entity.nom ||
          fosa.airesante?.nom_as === entity.nom_as
        );
      default:
        return [];
    }
  };

  // Fonction utilitaire pour obtenir le nom d'une entité
  const getEntityName = (entity: any, type: string): string => {
    switch (type) {
      case 'district':
        return entity.nom_ds || entity.nom || `District ${entity.id}`;
      case 'region':
        return entity.nom || `Région ${entity.id}`;
      case 'departement':
        return entity.nom || entity.departement || `Département ${entity.id}`;
      case 'arrondissement':
        return entity.nom || `Arrondissement ${entity.id}`;
      case 'airesante':
        return entity.nom_as || entity.nom || `Aire de santé ${entity.id}`;
      default:
        return entity.nom || `Entité ${entity.id}`;
    }
  };

  // Calcul des statistiques pour les titres fonciers
  const titreFoncierStats = useMemo(() => {
    if (!fosasData.length) return {};

    const stats: any = {};

    entitiesData.forEach(entity => {
      const entityFosas = getFosasForEntity(entity);
      const withTitreFoncier = entityFosas.filter(fosa =>
        fosa.aTitreFoncier === true || fosa.aTitreFoncier === 1
      ).length;

      const percentage = entityFosas.length > 0
        ? Math.round((withTitreFoncier / entityFosas.length) * 100)
        : 0;

      const entityName = getEntityName(entity, entityType);
      stats[entityName] = {
        total: entityFosas.length,
        withTitreFoncier,
        percentage,
        entityId: entity.id
      };
    });

    return stats;
  }, [fosasData, entitiesData, entityType]);

  // Calcul des statistiques pour les clôtures
  const clotureStats = useMemo(() => {
    if (!fosasData.length) return {};

    const stats: any = {};

    entitiesData.forEach(entity => {
      const entityFosas = getFosasForEntity(entity);
      const withCloture = entityFosas.filter(fosa =>
        fosa.aCloture === true || fosa.aCloture === 1
      ).length;

      const percentage = entityFosas.length > 0
        ? Math.round((withCloture / entityFosas.length) * 100)
        : 0;

      const entityName = getEntityName(entity, entityType);
      stats[entityName] = {
        total: entityFosas.length,
        withCloture,
        percentage,
        entityId: entity.id
      };
    });

    return stats;
  }, [fosasData, entitiesData, entityType]);

  // Calcul des statistiques pour l'électricité
  const electriciteStats = useMemo(() => {
    if (!fosasData.length) return {};

    const stats: any = {};

    entitiesData.forEach(entity => {
      const entityFosas = getFosasForEntity(entity);
      const withElectricite = entityFosas.filter(fosa =>
        fosa.connecteeElectricite === true || fosa.connecteeElectricite === 1
      ).length;

      const percentage = entityFosas.length > 0
        ? Math.round((withElectricite / entityFosas.length) * 100)
        : 0;

      const entityName = getEntityName(entity, entityType);
      stats[entityName] = {
        total: entityFosas.length,
        withElectricite,
        percentage,
        entityId: entity.id
      };
    });

    return stats;
  }, [fosasData, entitiesData, entityType]);

  // Calcul des statistiques par type de FOSA
  const typeStats = useMemo(() => {
    if (!fosasData.length) return {};

    const stats: any = {};

    entitiesData.forEach(entity => {
      const entityFosas = getFosasForEntity(entity);

      const typesCount: any = {};
      entityFosas.forEach(fosa => {
        const type = fosa.type || fosa.catRec || 'Non spécifié';
        typesCount[type] = (typesCount[type] || 0) + 1;
      });

      const entityName = getEntityName(entity, entityType);
      stats[entityName] = {
        total: entityFosas.length,
        types: typesCount,
        typeCount: Object.keys(typesCount).length,
        entityId: entity.id
      };
    });

    return stats;
  }, [fosasData, entitiesData, entityType]);

  // Calcul des statistiques pour les FOSA fonctionnelles
  const fonctionStats = useMemo(() => {
    if (!fosasData.length) return {};

    const stats: any = {};

    entitiesData.forEach(entity => {
      const entityFosas = getFosasForEntity(entity);
      const fonctionnelles = entityFosas.filter(fosa =>
        fosa.fonction === true || fosa.fonction === 1
      ).length;

      const percentage = entityFosas.length > 0
        ? Math.round((fonctionnelles / entityFosas.length) * 100)
        : 0;

      const entityName = getEntityName(entity, entityType);
      stats[entityName] = {
        total: entityFosas.length,
        fonctionnelles,
        percentage,
        entityId: entity.id
      };
    });

    return stats;
  }, [fosasData, entitiesData, entityType]);

  // Calcul de la capacité moyenne en lits
  const capaciteStats = useMemo(() => {
    if (!fosasData.length) return {};

    const stats: any = {};

    entitiesData.forEach(entity => {
      const entityFosas = getFosasForEntity(entity);
      const fosasAvecLits = entityFosas.filter(fosa =>
        fosa.capaciteLits && fosa.capaciteLits > 0
      );

      const capaciteMoyenne = fosasAvecLits.length > 0
        ? Math.round(fosasAvecLits.reduce((sum, fosa) => sum + (fosa.capaciteLits || 0), 0) / fosasAvecLits.length)
        : 0;

      const entityName = getEntityName(entity, entityType);
      stats[entityName] = {
        total: entityFosas.length,
        avecLits: fosasAvecLits.length,
        capaciteMoyenne,
        entityId: entity.id
      };
    });

    return stats;
  }, [fosasData, entitiesData, entityType]);

  // Thèmes disponibles - CORRIGÉ
  const themes: ThematicTheme[] = [
    {
      id: 'titre-foncier',
      name: 'Titres Fonciers',
      description: 'Pourcentage de FOSA avec titre foncier',
      getColor: (stats: any) => { // ✅ Un seul argument
        if (!stats || stats.total === 0) return '#e5e7eb';
        if (stats.percentage >= 80) return '#10b981';
        if (stats.percentage >= 50) return '#f59e0b';
        if (stats.percentage >= 20) return '#f97316';
        return '#ef4444';
      },
      getValue: (entity: any, entityType: string, getEntityName: (entity: any, type: string) => string) => { // ✅ Trois arguments
        return titreFoncierStats[getEntityName(entity, entityType)];
      },
      formatValue: (stats: any) => `${stats?.withTitreFoncier || 0}/${stats?.total || 0} (${stats?.percentage || 0}%)`,
      icon: <Home className="w-4 h-4" />
    },
    {
      id: 'cloture',
      name: 'Clôtures',
      description: 'Pourcentage de FOSA avec clôture',
      getColor: (stats: any) => { // ✅ Un seul argument
        if (!stats || stats.total === 0) return '#e5e7eb';
        if (stats.percentage >= 80) return '#10b981';
        if (stats.percentage >= 50) return '#f59e0b';
        if (stats.percentage >= 20) return '#f97316';
        return '#ef4444';
      },
      getValue: (entity: any, entityType: string, getEntityName: (entity: any, type: string) => string) => { // ✅ Trois arguments
        return clotureStats[getEntityName(entity, entityType)];
      },
      formatValue: (stats: any) => `${stats?.withCloture || 0}/${stats?.total || 0} (${stats?.percentage || 0}%)`,
      icon: <Fence className="w-4 h-4" />
    },
    {
      id: 'electricite',
      name: 'Électricité',
      description: 'Pourcentage de FOSA avec électricité',
      getColor: (stats: any) => { // ✅ Un seul argument
        if (!stats || stats.total === 0) return '#e5e7eb';
        if (stats.percentage >= 80) return '#10b981';
        if (stats.percentage >= 50) return '#f59e0b';
        if (stats.percentage >= 20) return '#f97316';
        return '#ef4444';
      },
      getValue: (entity: any, entityType: string, getEntityName: (entity: any, type: string) => string) => { // ✅ Trois arguments
        return electriciteStats[getEntityName(entity, entityType)];
      },
      formatValue: (stats: any) => `${stats?.withElectricite || 0}/${stats?.total || 0} (${stats?.percentage || 0}%)`,
      icon: <Zap className="w-4 h-4" />
    },
    {
      id: 'fonction',
      name: 'Fonctionnalité',
      description: 'Pourcentage de FOSA fonctionnelles',
      getColor: (stats: any) => { // ✅ Un seul argument
        if (!stats || stats.total === 0) return '#e5e7eb';
        if (stats.percentage >= 80) return '#10b981';
        if (stats.percentage >= 50) return '#f59e0b';
        if (stats.percentage >= 20) return '#f97316';
        return '#ef4444';
      },
      getValue: (entity: any, entityType: string, getEntityName: (entity: any, type: string) => string) => { // ✅ Trois arguments
        return fonctionStats[getEntityName(entity, entityType)];
      },
      formatValue: (stats: any) => `${stats?.fonctionnelles || 0}/${stats?.total || 0} (${stats?.percentage || 0}%)`,
      icon: <Building className="w-4 h-4" />
    },
    {
      id: 'type-fosa',
      name: 'Diversité',
      description: 'Nombre de types de FOSA différents',
      getColor: (stats: any) => { // ✅ Un seul argument
        if (!stats || stats.total === 0) return '#e5e7eb';
        const typeCount = stats.typeCount || 0;
        if (typeCount >= 5) return '#8b5cf6';
        if (typeCount >= 3) return '#3b82f6';
        if (typeCount >= 2) return '#06b6d4';
        return '#6366f1';
      },
      getValue: (entity: any, entityType: string, getEntityName: (entity: any, type: string) => string) => { // ✅ Trois arguments
        return typeStats[getEntityName(entity, entityType)];
      },
      formatValue: (stats: any) => `${stats?.typeCount || 0} types sur ${stats?.total || 0} FOSA`,
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      id: 'capacite',
      name: 'Capacité en lits',
      description: 'Capacité moyenne en lits par FOSA',
      getColor: (stats: any) => { // ✅ Un seul argument
        if (!stats || stats.avecLits === 0) return '#e5e7eb';
        if (stats.capaciteMoyenne >= 50) return '#10b981';
        if (stats.capaciteMoyenne >= 20) return '#f59e0b';
        if (stats.capaciteMoyenne >= 10) return '#f97316';
        return '#ef4444';
      },
      getValue: (entity: any, entityType: string, getEntityName: (entity: any, type: string) => string) => { // ✅ Trois arguments
        return capaciteStats[getEntityName(entity, entityType)];
      },
      formatValue: (stats: any) => `${stats?.capaciteMoyenne || 0} lits en moyenne`,
      icon: <Shield className="w-4 h-4" />
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

  // Obtenir les statistiques pour le thème sélectionné
  const getCurrentStats = () => {
    switch (selectedTheme) {
      case 'titre-foncier': return titreFoncierStats;
      case 'cloture': return clotureStats;
      case 'electricite': return electriciteStats;
      case 'fonction': return fonctionStats;
      case 'type-fosa': return typeStats;
      case 'capacite': return capaciteStats;
      default: return {};
    }
  };

  const currentStats = getCurrentStats();
  const selectedThemeObj = themes.find(t => t.id === selectedTheme);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-emerald-200 max-w-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Layers className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-gray-800 text-sm">Analyse Thématique</h3>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full capitalize">
          {entityType}
        </span>
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
                  {entitiesData.map(entity => {
                    const stats = theme.getValue(entity, entityType, getEntityName); // ✅ Appel correct avec 3 arguments

                    return (
                      <div key={entity.id} className="flex justify-between items-center">
                        <span className="font-medium text-gray-700 truncate flex-1 mr-2">
                          {getEntityName(entity, entityType)}
                        </span>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="text-gray-600 text-xs">
                            {theme.formatValue(stats)}
                          </span>
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: theme.getColor(stats) }} // ✅ Appel correct avec 1 argument
                          />
                        </div>
                      </div>
                    );
                  })}

                  {entitiesData.length === 0 && (
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

      {selectedTheme && selectedThemeObj && (
        <div className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-emerald-700 font-medium">Légende:</span>
            <span className="text-emerald-600">{selectedThemeObj.name}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
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
            <div className="text-emerald-600">
              {Object.keys(currentStats).length} {entityType}s
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThematicAnalysis;