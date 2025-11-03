"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import { fosaService } from "../services/fosaService"
import type { Fosa } from "../types"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

export default function MapPage() {
  const [fosas, setFosas] = useState<Fosa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFosas()
  }, [])

  const loadFosas = async () => {
    try {
      const response = await fosaService.getAll({ limit: 1000 })
      setFosas(response.data.filter((f) => f.latitude && f.longitude))
    } catch (error) {
      console.error("Error loading fosas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Chargement de la carte...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Carte des Formations Sanitaires</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
        <MapContainer center={[3.848, 11.5021]} zoom={6} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {fosas.map((fosa) => (
            <Marker key={fosa.id} position={[fosa.latitude, fosa.longitude]}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg">{fosa.nom}</h3>
                  <p className="text-sm text-gray-600">Type: {fosa.type}</p>
                  <p className="text-sm text-gray-600">Capacité: {fosa.capacite}</p>
                  <p className="text-sm text-gray-600">
                    Statut:{" "}
                    <span className={fosa.fermeture ? "text-red-600" : "text-green-600"}>
                      {fosa.fermeture ? "Fermé" : "Ouvert"}
                    </span>
                  </p>
                  {fosa.image && (
                    <img
                      src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${fosa.image}`}
                      alt={fosa.nom}
                      className="mt-2 w-full h-32 object-cover rounded"
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Statistiques</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total FOSA</p>
            <p className="text-2xl font-bold">{fosas.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ouvertes</p>
            <p className="text-2xl font-bold text-green-600">{fosas.filter((f) => !f.fermeture).length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fermées</p>
            <p className="text-2xl font-bold text-red-600">{fosas.filter((f) => f.fermeture).length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Capacité Totale</p>
            <p className="text-2xl font-bold">{fosas.reduce((sum, f) => sum + f.capacite, 0)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
