import React, { useState, useMemo, useCallback } from 'react';
import { Layers, Fence, Home } from 'lucide-react';

export interface ThematicTheme {
  id: string;
  name: string;
  description: string;
  getColor: (value: any) => string;
  getValue: (entity: any, entityType: string, getEntityName: (entity: any, type: string) => string) => any;
  formatValue: (value: any) => string;
  icon: React.ReactNode;
}

interface ThematicAnalysisProps {
  entitiesData: any[];
  fosasData: any[];
  onThemeChange: (theme: ThematicTheme | null) => void;
  entityType: 'region' | 'departement' | 'district' | 'arrondissement' | 'airesante';
  airesantesData?: any[];
}

const ThematicAnalysis: React.FC<ThematicAnalysisProps> = ({
  entitiesData,
  fosasData,
  onThemeChange,
  entityType,
  airesantesData = [],
}) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('');

  console.log('🗂️ ThematicAnalysis rendu avec:');
  console.log('  📁 fosasData:', fosasData.length, 'FOSA');
  console.log('  🏛️ entitiesData:', entitiesData.length, entityType);
  console.log('  🏥 airesantesData:', airesantesData.length, 'aires de santé');

  // Afficher un échantillon des données pour déboguer
  if (fosasData.length > 0) {
    console.log('  📋 Échantillon FOSA:', fosasData[0]);
  }
  if (airesantesData.length > 0) {
    console.log('  📋 Échantillon aire de santé:', airesantesData[0]);
  }

  // Fonction pour obtenir le nom d'une entité
  const getEntityName = useCallback((entity: any, type: string): string => {
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
  }, []);

  // Fonction optimisée pour trouver les FOSA d'une entité
  const getFosasForEntity = useCallback((entity: any): any[] => {
    if (!fosasData || fosasData.length === 0) {
      console.log('⚠️ Aucune FOSA dans fosasData');
      return [];
    }

    let filteredFosas: any[] = [];

    switch (entityType) {
      case 'region':
        filteredFosas = fosasData.filter(fosa =>
          fosa.region?.id === entity.id ||
          fosa.region?.nom === entity.nom
        );
        break;

      case 'departement':
        filteredFosas = fosasData.filter(fosa =>
          fosa.departement?.id === entity.id ||
          fosa.departement?.nom === entity.nom
        );
        break;

      case 'district':
        // Pour le district, on peut filtrer de plusieurs façons selon la structure des données
        filteredFosas = fosasData.filter(fosa => {
          // Méthode 1 : La FOSA a un champ district direct (structure retournée par filtre région)
          if (fosa.district) {
            // Comparer par ID (le plus fiable)
            if (fosa.district.id === entity.id) {
              return true;
            }
            // Comparer par nom_ds
            if (fosa.district.nom_ds && entity.nom_ds && fosa.district.nom_ds === entity.nom_ds) {
              return true;
            }
            // Comparer par nom
            if (fosa.district.nom && entity.nom && fosa.district.nom === entity.nom) {
              return true;
            }
            // Comparer par code
            if (fosa.district.code && entity.code_ds && fosa.district.code === entity.code_ds) {
              return true;
            }
            return false;
          }

          // Méthode 2 : La FOSA a une aire de santé avec district
          if (fosa.airesante?.district) {
            if (fosa.airesante.district.id === entity.id) return true;
            if (fosa.airesante.district.nom_ds === entity.nom_ds) return true;
            if (fosa.airesante.district.nom === entity.nom) return true;
            return false;
          }

          // Méthode 3 : Utiliser airesantesData pour le mapping
          if (airesantesData && airesantesData.length > 0 && (fosa.airesanteId || fosa.airesante?.id)) {
            const fosaAiresanteId = fosa.airesanteId || fosa.airesante?.id;
            const airesante = airesantesData.find(as => as.id === fosaAiresanteId);
            if (airesante) {
              return airesante.districtId === entity.id || airesante.district?.id === entity.id;
            }
          }

          return false;
        });

        const entityNameForLog = getEntityName(entity, entityType);
        console.log(`📊 District "${entityNameForLog}" (ID: ${entity.id}): ${filteredFosas.length}/${fosasData.length} FOSA`);

        // Log un exemple de FOSA pour ce district (première trouvée)
        if (filteredFosas.length > 0) {
          console.log(`  ✓ Exemple: "${filteredFosas[0].nom}" - district:`, filteredFosas[0].district);
        }
        break;

      case 'arrondissement':
        filteredFosas = fosasData.filter(fosa =>
          fosa.arrondissementId === entity.id ||
          fosa.arrondissement?.id === entity.id ||
          fosa.arrondissement?.nom === entity.nom
        );
        break;

      case 'airesante':
        filteredFosas = fosasData.filter(fosa =>
          fosa.airesanteId === entity.id ||
          fosa.airesante?.id === entity.id ||
          fosa.airesante?.nom === entity.nom ||
          fosa.airesante?.nom_as === entity.nom_as
        );
        break;

      default:
        filteredFosas = [];
    }

    return filteredFosas;
  }, [fosasData, entityType, airesantesData, getEntityName]);

  // Calcul des statistiques pour les titres fonciers
  const titreFoncierStats = useMemo(() => {
    console.log('🔄 Recalcul des statistiques titres fonciers...');
    console.log(`📁 ${fosasData.length} FOSA totales`);
    console.log(`🏛️ ${entitiesData.length} entités (${entityType})`);

    if (!fosasData.length || !entitiesData.length) {
      console.log('⚠️ Pas de données pour calculer les statistiques');
      return {};
    }

    const stats: any = {};

    entitiesData.forEach(entity => {
      const entityFosas = getFosasForEntity(entity);
      const entityName = getEntityName(entity, entityType);

      // Compter les FOSA avec titre foncier
      const withTitreFoncier = entityFosas.filter(fosa => {
        const hasTitre = fosa.aTitreFoncier === true || fosa.aTitreFoncier === 1;
        return hasTitre;
      }).length;

      const percentage = entityFosas.length > 0
        ? Math.round((withTitreFoncier / entityFosas.length) * 100)
        : 0;

      stats[entityName] = {
        total: entityFosas.length,
        withTitreFoncier,
        percentage,
        entityId: entity.id
      };

      console.log(`  ✓ ${entityName}: ${withTitreFoncier}/${entityFosas.length} avec titre foncier (${percentage}%)`);
    });

    console.log('✅ Statistiques titres fonciers calculées:', stats);
    return stats;
  }, [fosasData, entitiesData, entityType, getFosasForEntity, getEntityName]);

  // Calcul des statistiques pour les clôtures
  const clotureStats = useMemo(() => {
    console.log('🔄 Recalcul des statistiques clôtures...');

    if (!fosasData.length || !entitiesData.length) {
      return {};
    }

    const stats: any = {};

    entitiesData.forEach(entity => {
      const entityFosas = getFosasForEntity(entity);
      const entityName = getEntityName(entity, entityType);

      // Compter les FOSA avec clôture
      const withCloture = entityFosas.filter(fosa => {
        const hasCloture = fosa.aCloture === true || fosa.aCloture === 1;
        return hasCloture;
      }).length;

      const percentage = entityFosas.length > 0
        ? Math.round((withCloture / entityFosas.length) * 100)
        : 0;

      stats[entityName] = {
        total: entityFosas.length,
        withCloture,
        percentage,
        entityId: entity.id
      };

      console.log(`  ✓ ${entityName}: ${withCloture}/${entityFosas.length} avec clôture (${percentage}%)`);
    });

    console.log('✅ Statistiques clôtures calculées:', stats);
    return stats;
  }, [fosasData, entitiesData, entityType, getFosasForEntity, getEntityName]);

  // Thèmes disponibles
  const themes: ThematicTheme[] = useMemo(() => [
    {
      id: 'titre-foncier',
      name: 'Titres Fonciers',
      description: 'Nombre de FOSA avec titre foncier',
      getColor: (stats: any) => {
        if (!stats || stats.total === 0) return '#e5e7eb';
        if (stats.percentage >= 80) return '#10b981';
        if (stats.percentage >= 50) return '#f59e0b';
        if (stats.percentage >= 20) return '#f97316';
        return '#ef4444';
      },
      getValue: (entity: any, entityType: string, getEntityName: (entity: any, type: string) => string) => {
        return titreFoncierStats[getEntityName(entity, entityType)];
      },
      formatValue: (stats: any) => {
        if (!stats) return `0/${fosasData.length}`;
        return `${stats.withTitreFoncier || 0}/${fosasData.length}`;
      },
      icon: <Home className="w-4 h-4" />
    },
    {
      id: 'cloture',
      name: 'Clôtures',
      description: 'Nombre de FOSA avec clôture',
      getColor: (stats: any) => {
        if (!stats || stats.total === 0) return '#e5e7eb';
        if (stats.percentage >= 80) return '#10b981';
        if (stats.percentage >= 50) return '#f59e0b';
        if (stats.percentage >= 20) return '#f97316';
        return '#ef4444';
      },
      getValue: (entity: any, entityType: string, getEntityName: (entity: any, type: string) => string) => {
        return clotureStats[getEntityName(entity, entityType)];
      },
      formatValue: (stats: any) => {
        if (!stats) return `0/${fosasData.length}`;
        return `${stats.withCloture || 0}/${fosasData.length}`;
      },
      icon: <Fence className="w-4 h-4" />
    }
  ], [titreFoncierStats, clotureStats, fosasData.length]);

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

  const getCurrentStats = () => {
    switch (selectedTheme) {
      case 'titre-foncier': return titreFoncierStats;
      case 'cloture': return clotureStats;
      default: return {};
    }
  };

  const currentStats = getCurrentStats();
  const selectedThemeObj = themes.find(t => t.id === selectedTheme);

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-emerald-200 max-w-sm w-full">
      <div className="flex items-center space-x-2 mb-4">
        <Layers className="w-5 h-5 text-emerald-600" />
        <h3 className="font-semibold text-gray-800 text-sm">Analyse Thématique</h3>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full capitalize">
          {entityType}
        </span>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
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
                  <div className={`p-1 rounded ${selectedTheme === theme.id
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-gray-100 text-gray-600'
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
                    const stats = theme.getValue(entity, entityType, getEntityName);

                    return (
                      <div key={entity.id} className="flex justify-between items-center group">
                        <span className="font-medium text-gray-700 truncate flex-1 mr-2 group-hover:text-gray-900">
                          {getEntityName(entity, entityType)}
                        </span>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="text-gray-900 font-bold text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-sm">
                            {theme.formatValue(stats)}
                          </span>
                          <div
                            className="w-3 h-3 rounded shadow-sm"
                            style={{ backgroundColor: theme.getColor(stats) }}
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
            <span className="text-emerald-700 font-medium">Légende (Proportion):</span>
            <span className="text-emerald-600 font-bold">{selectedThemeObj.name}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1" title=">= 80%">
                <div className="w-2 h-2 bg-emerald-500 rounded"></div>
                <span className="text-[10px] text-gray-600">Élevé</span>
              </div>
              <div className="flex items-center space-x-1" title=">= 50%">
                <div className="w-2 h-2 bg-amber-500 rounded"></div>
                <span className="text-[10px] text-gray-600">Moyen</span>
              </div>
              <div className="flex items-center space-x-1" title="< 50%">
                <div className="w-2 h-2 bg-red-500 rounded"></div>
                <span className="text-[10px] text-gray-600">Faible</span>
              </div>
            </div>
            <div className="text-emerald-600 text-[10px]">
              {Object.keys(currentStats).length} {entityType}s
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThematicAnalysis;
