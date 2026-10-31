// MapLegend.tsx
import React from 'react';
import { ThematicTheme } from './ThematicAnalysis';

interface MapLegendProps {
  theme: ThematicTheme;
}

/** Légende des polygones colorés par l'analyse thématique (mêmes seuils que colorForIndicator). */
const MapLegend: React.FC<MapLegendProps> = ({ theme }) => {
  const items = [
    { color: '#10b981', label: `≥ 80 % ${theme.legendLabel}` },
    { color: '#f59e0b', label: `50 à 79 % ${theme.legendLabel}` },
    { color: '#f97316', label: `20 à 49 % ${theme.legendLabel}` },
    { color: '#ef4444', label: `< 20 % ${theme.legendLabel}` },
    { color: '#cbd5e1', label: 'Donnée non renseignée' },
    { color: '#e5e7eb', label: 'Aucune FOSA rattachée' },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm">
      <p className="kicker mb-1">Légende</p>
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 [&_svg]:text-brand-500">
        {theme.icon}
        {theme.name}
      </h4>
      <div className="space-y-2 text-xs">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="size-3.5 shrink-0 rounded border border-black/10" style={{ backgroundColor: item.color }} />
            <span className="text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-500">{theme.description}</p>
      </div>
    </div>
  );
};

export default MapLegend;
