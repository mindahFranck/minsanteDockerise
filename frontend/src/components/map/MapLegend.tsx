// MapLegend.tsx
import React from 'react';
import { ThematicTheme } from './ThematicAnalysis';

interface MapLegendProps {
  theme: ThematicTheme;
}

const MapLegend: React.FC<MapLegendProps> = ({ theme }) => {
  const getLegendItems = () => {
    switch (theme.id) {
      case 'titre-foncier':
        return [
          { color: '#10b981', label: '≥ 80% avec titre foncier' },
          { color: '#f59e0b', label: '50-79% avec titre foncier' },
          { color: '#f97316', label: '20-49% avec titre foncier' },
          { color: '#ef4444', label: '< 20% avec titre foncier' },
          { color: '#e5e7eb', label: 'Aucune donnée' }
        ];
      case 'cloture':
        return [
          { color: '#10b981', label: '≥ 80% avec clôture' },
          { color: '#f59e0b', label: '50-79% avec clôture' },
          { color: '#f97316', label: '20-49% avec clôture' },
          { color: '#ef4444', label: '< 20% avec clôture' },
          { color: '#e5e7eb', label: 'Aucune donnée' }
        ];
      case 'type-fosa':
        return [
          { color: '#8b5cf6', label: '5+ types différents' },
          { color: '#3b82f6', label: '3-4 types différents' },
          { color: '#06b6d4', label: '2 types différents' },
          { color: '#6366f1', label: '1 type seulement' },
          { color: '#e5e7eb', label: 'Aucune donnée' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="max-w-xs rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm">
      <p className="kicker mb-1">Légende</p>
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 [&_svg]:text-brand-500">
        {theme.icon}
        Légende: {theme.name}
      </h4>
      <div className="space-y-2 text-xs">
        {getLegendItems().map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="size-3.5 shrink-0 rounded border border-black/10"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500">
          {theme.description}
        </p>
      </div>
    </div>
  );
};

export default MapLegend;