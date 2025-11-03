"use client"

import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Map, Building2, Users, Package, Truck, MapPin, LogOut, Menu, X,
  Building, Wrench, Activity, Tag, AlertTriangle, Settings, UserCircle, Stethoscope,
  ChevronDown, ChevronRight
} from "lucide-react"
import { useState } from "react"

interface LayoutProps {
  onLogout: () => void
}

interface NavItem {
  name: string
  href: string
  icon: any
}

interface NavSection {
  title: string
  items: NavItem[]
  collapsible?: boolean
}

export default function Layout({ onLogout }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['Principal', 'Géographie', 'Infrastructures'])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    onLogout()
    navigate("/")
  }

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    )
  }

  const navigationSections: NavSection[] = [
    {
      title: "Principal",
      collapsible: false,
      items: [
        { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
        { name: "Carte", href: "/dashboard/map", icon: Map },
      ]
    },
    {
      title: "Géographie",
      collapsible: true,
      items: [
        { name: "Régions", href: "/dashboard/regions", icon: MapPin },
        { name: "Départements", href: "/dashboard/departements", icon: MapPin },
        { name: "Arrondissements", href: "/dashboard/arrondissements", icon: MapPin },
        { name: "Districts", href: "/dashboard/districts", icon: MapPin },
        { name: "Aires de Santé", href: "/dashboard/airesantes", icon: MapPin },
      ]
    },
    {
      title: "Infrastructures",
      collapsible: true,
      items: [
        { name: "FOSA", href: "/dashboard/fosas", icon: Building2 },
        { name: "Bâtiments", href: "/dashboard/batiments", icon: Building },
        { name: "Services", href: "/dashboard/services", icon: Activity },
      ]
    },
    {
      title: "Personnel",
      collapsible: true,
      items: [
        { name: "Personnel", href: "/dashboard/personnels", icon: Users },
        { name: "Catégories", href: "/dashboard/categories", icon: Tag },
      ]
    },
    {
      title: "Équipements",
      collapsible: true,
      items: [
        { name: "Équipements", href: "/dashboard/equipements", icon: Package },
        { name: "Équipements Bio", href: "/dashboard/equipebios", icon: Stethoscope },
        { name: "Matériel Roulant", href: "/dashboard/materielroulants", icon: Truck },
      ]
    },
    {
      title: "Administration",
      collapsible: true,
      items: [
        { name: "Utilisateurs", href: "/dashboard/users", icon: UserCircle },
        { name: "Paramètres", href: "/dashboard/parametres", icon: Settings },
        { name: "Dégradations", href: "/dashboard/degradations", icon: AlertTriangle },
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-800">Santé Cameroun</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {navigationSections.map((section) => {
            const isExpanded = expandedSections.includes(section.title)
            const hasActiveItem = section.items.some(item => location.pathname === item.href)

            return (
              <div key={section.title}>
                {section.collapsible ? (
                  <div>
                    <button
                      onClick={() => toggleSection(section.title)}
                      className={`flex items-center justify-between w-full px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                        hasActiveItem ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span>{section.title}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="mt-1 ml-4 space-y-1">
                        {section.items.map((item) => {
                          const Icon = item.icon
                          const isActive = location.pathname === item.href
                          return (
                            <Link
                              key={item.name}
                              to={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                isActive ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              <Icon className="w-4 h-4 mr-3" />
                              {item.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.href
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                              isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <Icon className="w-4 h-4 mr-3" />
                            {item.name}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <div className="p-4 border-t flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-6">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{JSON.parse(localStorage.getItem("user") || "{}").name}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
