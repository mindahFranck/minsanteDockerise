import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, Map, Building2, ChevronDown, ChevronRight,
  Users, FileText, Settings as SettingsIcon, BarChart3,
  HelpCircle, MapPin, Hospital, Stethoscope, Wrench,
  UserCog, Shield, Activity, Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path?: string;
  roles: string[];
  children?: MenuItem[];
}

const SidebarNew: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['geographic', 'fosas']);

  const menuItems: MenuItem[] = [
    {
      icon: Home,
      label: 'Tableau de Bord',
      path: '/dashboard',
      roles: ['super_admin', 'admin', 'manager', 'user']
    },
    {
      icon: Map,
      label: 'Carte Interactive',
      path: '/',
      roles: ['super_admin', 'admin', 'manager', 'user']
    },
    {
      icon: MapPin,
      label: 'Géographie',
      roles: ['super_admin', 'admin', 'manager', 'user'],
      children: [
        { icon: MapPin, label: 'Régions', path: '/regions', roles: ['super_admin', 'admin', 'manager', 'user'] },
        { icon: MapPin, label: 'Départements', path: '/departements', roles: ['super_admin', 'admin', 'manager', 'user'] },
        { icon: MapPin, label: 'Arrondissements', path: '/arrondissements', roles: ['super_admin', 'admin', 'manager', 'user'] },
        { icon: MapPin, label: 'Districts', path: '/districts', roles: ['super_admin', 'admin', 'manager', 'user'] },
        { icon: MapPin, label: 'Aires de Santé', path: '/airesantes', roles: ['super_admin', 'admin', 'manager', 'user'] },
      ]
    },
    {
      icon: Hospital,
      label: 'FOSA',
      roles: ['super_admin', 'admin', 'manager', 'user'],
      children: [
        { icon: Hospital, label: 'Liste des FOSA', path: '/fosas', roles: ['super_admin', 'admin', 'manager', 'user'] },
        { icon: Building2, label: 'Bâtiments', path: '/batiments', roles: ['super_admin', 'admin', 'manager', 'user'] },
        { icon: Stethoscope, label: 'Services', path: '/services', roles: ['super_admin', 'admin', 'manager', 'user'] },
      ]
    },
    {
      icon: Users,
      label: 'Ressources Humaines',
      roles: ['super_admin', 'admin', 'manager', 'user'],
      children: [
        { icon: Users, label: 'Personnel', path: '/personnels', roles: ['super_admin', 'admin', 'manager', 'user'] },
        { icon: FileText, label: 'Catégories', path: '/categories', roles: ['super_admin', 'admin', 'manager', 'user'] },
      ]
    },
    {
      icon: Package,
      label: 'Équipements',
      roles: ['super_admin', 'admin', 'manager', 'user'],
      children: [
        { icon: Wrench, label: 'Équipements Médicaux', path: '/equipements', roles: ['super_admin', 'admin', 'manager', 'user'] },
        { icon: Activity, label: 'Équipements Biomédicaux', path: '/equipebios', roles: ['super_admin', 'admin', 'manager', 'user'] },
        { icon: Package, label: 'Matériel Roulant', path: '/materielroulants', roles: ['super_admin', 'admin', 'manager', 'user'] },
      ]
    },
    {
      icon: Wrench,
      label: 'Dégradations',
      path: '/degradations',
      roles: ['super_admin', 'admin', 'manager']
    },
    {
      icon: BarChart3,
      label: 'Statistiques',
      path: '/statistics',
      roles: ['super_admin', 'admin', 'manager', 'user']
    },
    {
      icon: Shield,
      label: 'Administration',
      roles: ['super_admin', 'admin'],
      children: [
        { icon: UserCog, label: 'Utilisateurs', path: '/users', roles: ['super_admin', 'admin'] },
        { icon: FileText, label: 'Audit Trail', path: '/audit', roles: ['super_admin', 'admin'] },
        { icon: SettingsIcon, label: 'Paramètres', path: '/parametres', roles: ['super_admin', 'admin'] },
      ]
    },
  ];

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(item => user?.role && item.roles.includes(user.role))
      .map(item => ({
        ...item,
        children: item.children ? filterMenuItems(item.children) : undefined
      }))
      .filter(item => !item.children || item.children.length > 0);
  };

  const filteredMenuItems = filterMenuItems(menuItems);

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.label);
    const isActive = item.path === location.pathname;
    const hasActiveChild = item.children?.some(child => child.path === location.pathname);

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleMenu(item.label)}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all duration-200 ${
              hasActiveChild
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } ${level > 0 ? 'ml-4' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path!}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
            level > 0 ? 'ml-4' : ''
          } ${
            isActive
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`
        }
      >
        <item.icon className={`w-5 h-5 transition-transform duration-200 ${
          isActive ? 'scale-110' : 'group-hover:scale-105'
        }`} />
        <span className="font-medium text-sm">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Hospital className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">SIGH</h1>
            <p className="text-xs text-gray-400">Système de Gestion</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {filteredMenuItems.map(item => renderMenuItem(item))}
      </nav>

      <div className="p-4 space-y-2 border-t border-gray-800">
        {user && (
          <div className="px-4 py-2 bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-400">Connecté en tant que</p>
            <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-gray-500">{user.role}</p>
          </div>
        )}
        <button className="flex items-center space-x-3 px-4 py-2 text-gray-400 hover:text-white transition-colors w-full text-left rounded-lg hover:bg-gray-800">
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm">Aide</span>
        </button>
        <div className="text-xs text-gray-500 text-center pt-2">
          © 2024 MINSANTE
        </div>
      </div>
    </aside>
  );
};

export default SidebarNew;
