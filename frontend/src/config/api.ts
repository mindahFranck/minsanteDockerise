const API_URL =
  import.meta.env.VITE_API_URL || "https://apiminsante.it-grafik.com/api/v1";

export const config = {
  apiUrl: API_URL,
  timeout: 60000, // 60 secondes pour les requêtes lourdes (districts, aires de santé avec geom)
};

export default config;
