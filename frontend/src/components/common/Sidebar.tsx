import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, Guitar as Hospital, Activity, TrendingUp, Users, FileText, Settings as SettingsIcon, BarChart3, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Tableau de Bord', path: '/dashboard', roles: ['super_admin', 'admin', 'manager', 'user'] },
    { icon: Map, label: 'Carte Interactive', path: '/', roles: ['super_admin', 'admin', 'manager', 'user'] },
    { icon: Hospital, label: 'Hôpitaux', path: '/hospitals', roles: ['super_admin', 'admin', 'manager', 'user'] },
    { icon: Activity, label: 'Maintenance', path: '/maintenance', roles: ['super_admin', 'admin', 'manager'] },
    { icon: TrendingUp, label: 'Planification', path: '/planning', roles: ['super_admin', 'admin', 'manager'] },
    { icon: BarChart3, label: 'Analyses', path: '/analytics', roles: ['super_admin', 'admin', 'manager', 'user'] },
    { icon: FileText, label: 'Rapports', path: '/reports', roles: ['super_admin', 'admin', 'manager', 'user'] },
    { icon: Users, label: 'Utilisateurs', path: '/users', roles: ['super_admin', 'admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className={`w-5 h-5 transition-transform duration-200 ${
              location.pathname === item.path ? 'scale-110' : 'group-hover:scale-105'
            }`} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 space-y-2 border-t border-gray-800">
        <button className="flex items-center space-x-3 px-4 py-2 text-gray-400 hover:text-white transition-colors w-full text-left">
          <SettingsIcon className="w-4 h-4" />
          <span className="text-sm">Paramètres</span>
        </button>
        <button className="flex items-center space-x-3 px-4 py-2 text-gray-400 hover:text-white transition-colors w-full text-left">
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm">Aide</span>
        </button>
        <div className="text-xs text-gray-500 text-center pt-2">
          © 2024 MINSANTE - SIGH v1.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;