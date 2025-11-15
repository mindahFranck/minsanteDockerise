import { ThematicTheme } from './ThematicAnalysis';

interface MapLegendProps {
  theme: ThematicTheme;
}

export default function MapLegend({ theme }: MapLegendProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">
        {theme.title}
      </h3>

      <div className="space-y-2">
        {theme.legend.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>

      {theme.statistics && (
        <div className="border-t pt-3 mt-3">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Min:</span>
              <span className="font-semibold">{theme.statistics.min.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Max:</span>
              <span className="font-semibold">{theme.statistics.max.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Moyenne:</span>
              <span className="font-semibold">{theme.statistics.mean.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
