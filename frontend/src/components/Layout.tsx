"use client"

import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import {
  Map, LogOut, Menu, X, ChevronDown, LayoutDashboard, MapPin, Building2, Building, Activity,
  Users, Tag, Package, Stethoscope, Truck, UserCircle, FileSpreadsheet, Settings, WifiOff, AlertTriangle,
} from "lucide-react"
import { useEffect, useRef, useState, type ComponentType } from "react"
import { usePermissions } from "../hooks/usePermissions"
import { useAuth } from "../contexts/AuthContext"
import { cn, ItGrafikCredit } from "./ui"

interface LayoutProps {
  onLogout: () => void
}

type PermissionKey = keyof ReturnType<typeof usePermissions>

interface NavItem {
  name: string
  href: string
  icon: ComponentType<{ className?: string }>
  requiresPermission?: PermissionKey
}

interface NavSection {
  title: string
  /** Lien direct (pas de menu déroulant). */
  href?: string
  items: NavItem[]
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  manager: "Gestionnaire",
  user: "Utilisateur",
}

const NAVIGATION: NavSection[] = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    items: [{ name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, requiresPermission: "canView" }],
  },
  {
    title: "Géographie",
    items: [
      { name: "Régions", href: "/dashboard/regions", icon: MapPin, requiresPermission: "canViewAllRegions" },
      { name: "Départements", href: "/dashboard/departements", icon: MapPin, requiresPermission: "canViewAllRegions" },
      { name: "Arrondissements", href: "/dashboard/arrondissements", icon: MapPin, requiresPermission: "canViewAllRegions" },
      { name: "Districts", href: "/dashboard/districts", icon: MapPin, requiresPermission: "canViewAllRegions" },
      { name: "Aires de santé", href: "/dashboard/airesantes", icon: MapPin, requiresPermission: "canViewAllRegions" },
    ],
  },
  {
    title: "Infrastructures",
    items: [
      { name: "FOSA", href: "/dashboard/fosas", icon: Building2, requiresPermission: "canView" },
      { name: "Bâtiments", href: "/dashboard/batiments", icon: Building, requiresPermission: "canView" },
      { name: "Services", href: "/dashboard/services", icon: Activity, requiresPermission: "canView" },
    ],
  },
  {
    title: "Personnel",
    items: [
      { name: "Personnel", href: "/dashboard/personnels", icon: Users, requiresPermission: "canView" },
      { name: "Catégories", href: "/dashboard/categories", icon: Tag, requiresPermission: "canView" },
    ],
  },
  {
    title: "Équipements",
    items: [
      { name: "Équipements", href: "/dashboard/equipements", icon: Package, requiresPermission: "canView" },
      { name: "Équipements biomédicaux", href: "/dashboard/equipebios", icon: Stethoscope, requiresPermission: "canView" },
      { name: "Matériel roulant", href: "/dashboard/materielroulants", icon: Truck, requiresPermission: "canView" },
    ],
  },
  {
    title: "Administration",
    items: [
      { name: "Utilisateurs", href: "/dashboard/users", icon: UserCircle, requiresPermission: "canManageUsers" },
      { name: "Import Excel", href: "/dashboard/import", icon: FileSpreadsheet, requiresPermission: "canImportData" },
      { name: "Paramètres", href: "/dashboard/parametres", icon: Settings, requiresPermission: "canManageSettings" },
      { name: "Dégradations", href: "/dashboard/degradations", icon: AlertTriangle, requiresPermission: "canManageDegradations" },
      { name: "Mode hors ligne", href: "/dashboard/hors-ligne", icon: WifiOff },
    ],
  },
]

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase()
}

/**
 * Cadre des écrans authentifiés, sur le modèle BAOBAB : bandeau bleu marine
 * (marque, onglets, profil) au-dessus d'une surface gris clair.
 */
export default function Layout({ onLogout }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const permissions = usePermissions()
  const { user } = useAuth()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const stored = user ?? JSON.parse(localStorage.getItem("user") || "null")
  const displayName =
    [stored?.firstName ?? stored?.prenom, stored?.lastName ?? stored?.nom].filter(Boolean).join(" ") ||
    stored?.name ||
    stored?.email ||
    "Utilisateur"
  const roleLabel = ROLE_LABELS[stored?.role ?? ""] ?? ""

  const sections = NAVIGATION.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.requiresPermission || permissions[item.requiresPermission] === true),
  })).filter((section) => section.items.length > 0)

  const isActive = (href: string) => location.pathname === href
  const sectionActive = (section: NavSection) =>
    section.href ? location.pathname === section.href : section.items.some((item) => isActive(item.href))

  // Ferme les menus à chaque changement de page et au clic hors du bandeau.
  useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenMenu(null)
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenuOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null)
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    onLogout()
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 bg-header text-white">
        <div className="mx-auto flex h-16 max-w-[1600px] min-w-0 items-center gap-3 px-4 sm:px-6 xl:h-20 xl:gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="shrink-0 rounded-lg p-2 text-white/85 hover:bg-white/10 xl:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="size-5" />
          </button>

          <Link to="/dashboard" className="flex shrink-0 items-center gap-3">
            <img src="/favicon.svg" alt="" className="size-10 rounded-xl" />
            <span className="border-l border-white/25 pl-3">
              <span className="block text-[10px] uppercase tracking-[0.14em] text-white/60">MINSANTÉ</span>
              <span className="block text-lg font-bold leading-tight">IMMOSANTECam</span>
            </span>
          </Link>

          <nav ref={navRef} className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex 2xl:gap-1">
            {sections.map((section) => {
              const active = sectionActive(section)
              const pill = cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors 2xl:px-4",
                active ? "bg-white text-header" : "text-white/85 hover:bg-white/10",
              )

              if (section.href) {
                return (
                  <Link key={section.title} to={section.href} className={pill} aria-current={active ? "page" : undefined}>
                    {section.title}
                  </Link>
                )
              }

              const open = openMenu === section.title
              return (
                <div key={section.title} className="relative">
                  <button
                    type="button"
                    className={pill}
                    aria-expanded={open}
                    onClick={() => setOpenMenu(open ? null : section.title)}
                  >
                    {section.title}
                    <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
                  </button>
                  {open && (
                    <div className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-gray-200 bg-white p-2 text-gray-900 shadow-lg">
                      {section.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                              isActive(item.href) ? "bg-brand-50 text-brand-600" : "hover:bg-gray-50",
                            )}
                          >
                            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                              <Icon className="size-4" />
                            </span>
                            {item.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 xl:ml-0">
            <Link
              to="/"
              className="hidden h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-brand-900 transition-colors hover:bg-white/90 2xl:inline-flex"
            >
              <Map className="size-4" />
              Carte
            </Link>

            {/* Profil : la déconnexion est dans le menu de l'avatar */}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-3 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-white/10"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
                  {initialsOf(displayName)}
                </span>
                <span className="hidden max-w-[12rem] text-left leading-tight 2xl:block">
                  <span className="block truncate text-sm font-bold">{displayName}</span>
                  {roleLabel && <span className="block truncate text-xs text-white/60">{roleLabel}</span>}
                </span>
                <ChevronDown className={cn("size-4 text-white/70 transition-transform", userMenuOpen && "rotate-180")} />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-2 text-gray-900 shadow-lg"
                >
                  <div className="border-b border-gray-100 px-3 pb-3 pt-2">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    {stored?.email && <p className="truncate text-xs text-gray-500">{stored.email}</p>}
                    {roleLabel && <p className="kicker mt-2">{roleLabel}</p>}
                  </div>
                  <Link
                    to="/"
                    role="menuitem"
                    className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-gray-50 2xl:hidden"
                  >
                    <Map className="size-4 text-gray-500" />
                    Carte publique
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger-soft"
                  >
                    <LogOut className="size-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-lg">
            <div className="flex h-16 items-center justify-between bg-header px-4 text-white">
              <span className="font-bold">IMMOSANTECam</span>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Fermer le menu">
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-5 overflow-y-auto p-4">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="kicker mb-2 px-3">{section.title}</p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                            isActive(item.href) ? "bg-brand-50 text-brand-600" : "text-gray-700 hover:bg-gray-50",
                          )}
                        >
                          <Icon className="size-4" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
              <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Map className="size-4" />
                Carte publique
              </Link>
            </nav>
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>

      <footer className="mx-auto flex max-w-[1600px] flex-col gap-1 border-t border-gray-200 px-4 py-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>IMMOSANTECam · Ministère de la Santé Publique du Cameroun</p>
        <ItGrafikCredit />
      </footer>
    </div>
  )
}
