"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { AlertCircle, Loader2, Lock, LogIn, Mail } from "lucide-react"

interface LoginProps {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const success = await login(email.trim(), password.trim())
      if (success) {
        onLogin()
        navigate("/dashboard")
      } else {
        setError("Email ou mot de passe incorrect")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Panneau de marque */}
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-header p-10 text-white lg:flex xl:p-14">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="size-11 rounded-xl" />
          <span className="border-l border-white/25 pl-3">
            <span className="block text-[10px] uppercase tracking-[0.14em] text-white/60">MINSANTÉ</span>
            <span className="block text-lg font-bold leading-tight">IMMOSANTECam</span>
          </span>
        </div>

        <div className="max-w-md">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">
            Ministère de la Santé Publique du Cameroun
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
            Le patrimoine des formations sanitaires, en un seul lieu.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/75">
            Inventaire, état et suivi des infrastructures, équipements et ressources des formations sanitaires
            du Cameroun — de la région à l'aire de santé.
          </p>
        </div>

        <p className="text-xs text-white/50">IMMOSANTECam - G1</p>

        {/* Motif décoratif discret */}
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full border-[40px] border-white/5" />
        <div aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 size-40 rounded-full border-[24px] border-white/5" />
      </aside>

      {/* Formulaire */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          {/* Marque (mobile) */}
          <div className="mb-6 flex items-center justify-center gap-3 rounded-2xl bg-header px-5 py-4 text-white lg:hidden">
            <img src="/favicon.svg" alt="" className="size-10 rounded-xl" />
            <span className="border-l border-white/25 pl-3">
              <span className="block text-[10px] uppercase tracking-[0.14em] text-white/60">MINSANTÉ</span>
              <span className="block text-lg font-bold leading-tight">IMMOSANTECam</span>
            </span>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <p className="kicker mb-1">Espace sécurisé</p>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">IMMOSANTECam - G1</h1>
              <p className="mt-1 text-sm text-gray-500">Ministère de la Santé Publique du Cameroun</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5 text-sm text-danger">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="label">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input pl-9"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input pl-9"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    Se connecter
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      </main>
    </div>
  )
}
