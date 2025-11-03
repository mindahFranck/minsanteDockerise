import React from 'react';
import { Routes, Route, Navigate, Outlet, HashRouter } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './common/Layout';
import LoginForm from './auth/LoginForm';
import Dashboard from './dashboard/Dashboard';
import HospitalsModule from './hospitals/HospitalsModule';
import PlanningModule from './planning/PlanningModule';
import BuildingsModule from './buildings/BuildingsModule';
import MaintenanceModule from './maintenance/MaintenanceModule';
import AnalyticsModule from './analytics/AnalyticsModule';
import ReportsModule from './reports/ReportsModule';
import UsersModule from './users/UsersModule';
import MapView from './map/MapView';
import DataManagement from './data/DataManagement';

const Router: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <HashRouter>
      <Routes>
        {/* Page publique (sans layout) */}
        <Route path="/" element={<MapView />} />

        {/* Page de login */}
        <Route path="/login" element={<LoginForm />} />

        {/* Routes protégées (avec layout) */}
        {isAuthenticated ? (
          <Route element={<Layout><Outlet /></Layout>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/data" element={<DataManagement />} />
            <Route path="/planning" element={<PlanningModule />} />
            <Route path="/buildings" element={<BuildingsModule />} />
            <Route path="/hospitals" element={<HospitalsModule />} />
            <Route path="/maintenance" element={<MaintenanceModule />} />
            <Route path="/analytics" element={<AnalyticsModule />} />
            <Route path="/reports" element={<ReportsModule />} />
            <Route path="/users" element={<UsersModule />} />


            <Route path="regions" element={<RegionsPage />} />
            <Route path="departements" element={<DepartementsPage />} />
            <Route path="arrondissements" element={<ArrondissementsPage />} />
            <Route path="districts" element={<DistrictsPage />} />
            <Route path="airesantes" element={<AiresantesPage />} />
            <Route path="fosas" element={<FosasPage />} />
            <Route path="personnels" element={<PersonnelsPage />} />
            <Route path="equipements" element={<EquipementsPage />} />
            <Route path="materielroulants" element={<MaterielroulantsPage />} />
            <Route path="map" element={<MapPage />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
      </Routes>
    </HashRouter >
  );
};

export default Router;