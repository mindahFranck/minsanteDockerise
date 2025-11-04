const API_URL =
  import.meta.env.VITE_API_URL || "https://apiminsante.it-grafik.com/api/v1";

export const config = {
  apiUrl: API_URL,
  timeout: 30000,
};

export default config;
