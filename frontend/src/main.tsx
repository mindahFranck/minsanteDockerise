import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import "./index.css"

// Log API URL for debugging
console.log('=== Frontend Configuration ===');
console.log('API URL:', import.meta.env.VITE_API_URL || 'NOT SET');
console.log('App Name:', import.meta.env.VITE_APP_NAME || 'NOT SET');
console.log('App Version:', import.meta.env.VITE_APP_VERSION || 'NOT SET');
console.log('============================');

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
