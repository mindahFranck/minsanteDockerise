"use client"

import type React from "react"

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect } from "react"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Layout from "./components/Layout"
import RegionsPage from "./pages/RegionsPage"
import DepartementsPage from "./pages/DepartementsPage"
import ArrondissementsPage from "./pages/ArrondissementsPage"
import DistrictsPage from "./pages/DistrictsPage"
import AiresantesPage from "./pages/AiresantesPage"
import FosasPage from "./pages/FosasPage"
import BatimentsPage from "./pages/BatimentsPage"
import ServicesPage from "./pages/ServicesPage"
import PersonnelsPage from "./pages/PersonnelsPage"
import EquipementsPage from "./pages/EquipementsPage"
import EquipebiosPage from "./pages/EquipebiosPage"
import MaterielroulantsPage from "./pages/MaterielroulantsPage"
import CategoriesPage from "./pages/CategoriesPage"
import DegradationsPage from "./pages/DegradationsPage"
import ParametresPage from "./pages/ParametresPage"
import UsersPage from "./pages/UsersPage"
import MapPage from "./pages/MapPage"
import MapView from "./components/map/MapView"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    setIsAuthenticated(!!token)
  }, [])

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<MapView />} />
        <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout onLogout={() => setIsAuthenticated(false)} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          {/* Gestion géographique */}
          <Route path="regions" element={<RegionsPage />} />
          <Route path="departements" element={<DepartementsPage />} />
          <Route path="arrondissements" element={<ArrondissementsPage />} />
          <Route path="districts" element={<DistrictsPage />} />
          <Route path="airesantes" element={<AiresantesPage />} />

          {/* Gestion des FOSA et infrastructures */}
          <Route path="fosas" element={<FosasPage />} />
          <Route path="batiments" element={<BatimentsPage />} />
          <Route path="services" element={<ServicesPage />} />

          {/* Gestion du personnel */}
          <Route path="personnels" element={<PersonnelsPage />} />
          <Route path="categories" element={<CategoriesPage />} />

          {/* Gestion des équipements */}
          <Route path="equipements" element={<EquipementsPage />} />
          <Route path="equipebios" element={<EquipebiosPage />} />
          <Route path="materielroulants" element={<MaterielroulantsPage />} />

          {/* Système et administration */}
          <Route path="users" element={<UsersPage />} />
          <Route path="parametres" element={<ParametresPage />} />
          <Route path="degradations" element={<DegradationsPage />} />

          {/* Visualisation */}
          <Route path="map" element={<MapPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
