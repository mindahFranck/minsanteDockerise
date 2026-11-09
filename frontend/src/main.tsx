/*
 * ============================================================
 *  Conçu et développé par IT-GRAFIK
 *  Contact : +237 655 378 864 / +237 675 104 130
 * ============================================================
 */
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App.tsx"
import "./index.css"

// Signature développeur, visible dans la console lors d'une inspection.
console.info(
  "%cConçu et développé par IT-GRAFIK%c\nContact : +237 655 378 864 / +237 675 104 130",
  "font-weight:bold;color:#003758",
  "color:#555",
)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
