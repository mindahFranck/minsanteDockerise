const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000/api/v1"

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

/**
 * URL publique d'une image de FOSA, identique pour tous les utilisateurs.
 * La base garde un chemin relatif au disque public (« fosas/x.jpg »), servi sous /storage ;
 * l'hôte est celui de l'API (jamais celui du navigateur ni localhost).
 */
export function resolveImageUrl(image?: string | null, apiUrl: string = API_URL): string | null {
  if (!image) return null
  if (/^(https?:|data:|blob:)/.test(image)) return image
  const base = apiUrl.replace(/\/api(\/v\d+)?\/?$/, "")
  const path = image.replace(/^\/+/, "").replace(/^(public\/)?(storage\/)?/, "")
  return `${base}/storage/${path}`
}

/** Contrôle côté navigateur, avant envoi : renvoie le motif du refus, ou null si le fichier est valide. */
export function validateImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Format non accepté. Utilisez une image JPEG, PNG, GIF ou WebP."
  if (file.size > IMAGE_MAX_BYTES) {
    return `Image trop lourde (${(file.size / 1024 / 1024).toFixed(1)} Mo). La taille maximale est de 5 Mo.`
  }
  return null
}
