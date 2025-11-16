import { useState, useEffect } from 'react';
import { cacheService } from '../services/cacheService';

/**
 * Composant de debug pour visualiser l'état du cache
 * À utiliser uniquement en développement
 */
export default function CacheDebug() {
  const [stats, setStats] = useState({ size: 0, keys: [], expired: 0 });
  const [isOpen, setIsOpen] = useState(false);

  const refreshStats = () => {
    setStats(cacheService.getStats());
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 2000); // Rafraîchir toutes les 2 secondes
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    cacheService.clear();
    refreshStats();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50 text-sm"
        title="Ouvrir les stats du cache"
      >
        Cache ({stats.size})
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 max-w-md w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-gray-800">Statistiques du Cache</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.size}</div>
            <div className="text-xs text-gray-600">Entrées</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.size - stats.expired}
            </div>
            <div className="text-xs text-gray-600">Valides</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-xs text-gray-600">Expirées</div>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Clés du cache :
          </div>
          {stats.keys.length > 0 ? (
            <div className="space-y-1">
              {stats.keys.map((key, idx) => (
                <div key={idx} className="text-xs text-gray-600 font-mono">
                  {key}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">Cache vide</div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={refreshStats}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Rafraîchir
          </button>
          <button
            onClick={handleClearCache}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Vider le cache
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          <strong>Note :</strong> Ce composant est destiné au développement uniquement.
          Les données en cache sont stockées en mémoire et dans localStorage.
        </div>
      </div>
    </div>
  );
}
