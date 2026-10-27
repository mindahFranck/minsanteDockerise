import type { AxiosError, AxiosInstance, AxiosResponse } from "axios"
import { toast } from "../components/ui/Toast"

/** Libellés des ressources de l'API, pour des messages lisibles (« Le véhicule a été ajouté »). */
const RESOURCES: Record<string, { label: string; feminine?: boolean }> = {
  regions: { label: "La région", feminine: true },
  departements: { label: "Le département" },
  arrondissements: { label: "L'arrondissement" },
  districts: { label: "Le district" },
  airesantes: { label: "L'aire de santé", feminine: true },
  fosas: { label: "La FOSA", feminine: true },
  batiments: { label: "Le bâtiment" },
  services: { label: "Le service" },
  personnels: { label: "L'agent" },
  categories: { label: "La catégorie", feminine: true },
  equipements: { label: "L'équipement" },
  equipebios: { label: "L'équipement biomédical" },
  materielroulants: { label: "Le véhicule" },
  users: { label: "L'utilisateur" },
  parametres: { label: "Le paramètre" },
  degradations: { label: "La dégradation", feminine: true },
}

/** Requêtes qui gèrent elles-mêmes leurs messages (connexion, import, statistiques…). */
const SILENT = [/\/auth\//, /\/import/, /\/statistics\//, /\/health/]

function resourceOf(url = "") {
  const path = url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/?api\/v1/, "").split("?")[0]
  const segment = path.split("/").filter(Boolean)[0] ?? ""
  return RESOURCES[segment]
}

/**
 * Traduit une erreur d'API en message compréhensible.
 * Les erreurs de validation listent les champs concernés, déjà en français côté API.
 */
export function describeApiError(error: unknown, action = "L'opération"): { title: string; message: string } {
  const err = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>
  const status = err?.response?.status
  const data = err?.response?.data

  if (!err?.response) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { title: "Vous êtes hors ligne", message: "La demande sera renvoyée automatiquement au retour de la connexion." }
    }
    if (err?.code === "ECONNABORTED") {
      return { title: "Le serveur met trop de temps à répondre", message: "Réessayez dans un instant." }
    }
    return { title: "Serveur injoignable", message: "Vérifiez votre connexion internet puis réessayez." }
  }

  if (status === 422 && data?.errors) {
    const lines = Object.values(data.errors).flat().slice(0, 4)
    return { title: "Le formulaire contient des erreurs", message: lines.map((line) => `• ${line}`).join("\n") }
  }

  switch (status) {
    case 400:
      return { title: `${action} n'a pas pu aboutir`, message: data?.message || "La demande est incomplète ou invalide." }
    case 401:
      return { title: "Session expirée", message: "Reconnectez-vous pour continuer." }
    case 403:
      return { title: "Action non autorisée", message: "Votre compte n'a pas les droits nécessaires pour cette action." }
    case 404:
      return { title: "Élément introuvable", message: "Il a peut-être été supprimé entre-temps. Actualisez la page." }
    case 409:
      return { title: "Conflit", message: data?.message || "Cet élément existe déjà ou est utilisé ailleurs." }
    case 413:
      return { title: "Fichier trop volumineux", message: "Réduisez la taille du fichier puis réessayez." }
    case 429:
      return { title: "Trop de tentatives", message: "Patientez une minute avant de réessayer." }
  }

  if (status && status >= 500) {
    return {
      title: "Erreur du serveur",
      message: "L'opération n'a pas été enregistrée. Réessayez ; si le problème persiste, contactez l'administrateur.",
    }
  }
  return { title: `${action} a échoué`, message: data?.message || "Réessayez dans un instant." }
}

function successMessage(response: AxiosResponse): string | null {
  const method = (response.config.method ?? "get").toLowerCase()
  if (method === "get") return null
  const resource = resourceOf(response.config.url)
  if (!resource) return method === "delete" ? "Suppression effectuée" : "Modifications enregistrées"
  const e = resource.feminine ? "e" : ""
  if (method === "post") return `${resource.label} a été ajouté${e}`
  if (method === "delete") return `${resource.label} a été supprimé${e}`
  return `${resource.label} a été mis${resource.feminine ? "e" : ""} à jour`
}

/**
 * Notifications automatiques : succès des écritures, échecs de toutes les
 * requêtes. Les pages n'ont plus besoin d'alert() ; une requête peut s'en
 * dispenser avec `{ headers: { "X-Silent": "1" } }`.
 */
export function attachNotifications(instance: AxiosInstance, options: { success?: boolean } = {}) {
  instance.interceptors.response.use(
    (response) => {
      const silent = response.config.headers?.["X-Silent"] || SILENT.some((re) => re.test(response.config.url ?? ""))
      if (options.success !== false && !silent) {
        const message = successMessage(response)
        if (message) toast.success(message)
      }
      return response
    },
    (error: AxiosError) => {
      const url = error.config?.url ?? ""
      const method = (error.config?.method ?? "get").toLowerCase()
      const silent = error.config?.headers?.["X-Silent"] || SILENT.some((re) => re.test(url))
      // Lectures hors ligne : l'indicateur de connexion le signale déjà.
      const offlineRead = method === "get" && typeof navigator !== "undefined" && !navigator.onLine
      if (!silent && !offlineRead && error.code !== "ERR_CANCELED") {
        const action = method === "get" ? "Le chargement" : method === "delete" ? "La suppression" : "L'enregistrement"
        const { title, message } = describeApiError(error, action)
        toast.error(title, message)
      }
      return Promise.reject(error)
    },
  )
}
