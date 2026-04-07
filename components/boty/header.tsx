"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, ShoppingBag, Search, User } from "lucide-react"
import { CartDrawer } from "./cart-drawer"
import { useCart } from "./cart-context"
import { useAuth } from "@/hooks/use-auth"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { setIsOpen, itemCount } = useCart()
  const { user, loading } = useAuth()
  const isAuthenticated = !loading && !!user

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 backdrop-blur-md rounded-lg py-0 my-0 animate-scale-fade-in bg-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.32)]" style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 10px 50px' }}>
        <div className="flex items-center justify-between h-[68px]">
          {/* Mobile menu button — only shown when authenticated */}
          {isAuthenticated && (
            <button
              type="button"
              className="lg:hidden p-2 text-foreground/80 hover:text-foreground boty-transition"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          {/* Desktop Navigation - Left (authenticated only) */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-6">
              <Link href="/marketplace" className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition">
                Marketplace
              </Link>
              <Link href="/community" className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition">
                Community
              </Link>
              <Link href="/vets" className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition">
                Vets
              </Link>
              <Link href="/ngos" className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition">
                NGOs
              </Link>
            </div>
          )}

          {/* Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <h1 className="font-serif text-3xl tracking-wider text-foreground uppercase font-bold">PawHaven</h1>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-4 ml-auto">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="p-2 text-foreground/70 hover:text-foreground boty-transition"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
                <Link
                  href="/dashboard"
                  className="hidden sm:block p-2 text-foreground/70 hover:text-foreground boty-transition"
                  aria-label="Dashboard"
                >
                  <User className="w-5 h-5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="relative p-2 text-foreground/70 hover:text-foreground boty-transition"
                  aria-label="Cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] flex items-center justify-center rounded-full">
                      {itemCount}
                    </span>
                  )}
                </button>
              </>
            ) : !loading && (
              <>
                <Link
                  href="/login"
                  className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-sm tracking-wide bg-foreground text-background px-4 py-2 rounded-full hover:bg-foreground/85 boty-transition"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>

        <CartDrawer />

        {/* Mobile Navigation (authenticated only) */}
        {isAuthenticated && (
          <div
            className={`lg:hidden overflow-hidden boty-transition ${
              isMenuOpen ? "max-h-64 pb-6" : "max-h-0"
            }`}
          >
            <div className="flex flex-col gap-4 pt-4 border-t border-border/50">
              <Link href="/marketplace" className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition" onClick={() => setIsMenuOpen(false)}>
                Marketplace
              </Link>
              <Link href="/community" className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition" onClick={() => setIsMenuOpen(false)}>
                Community
              </Link>
              <Link href="/vets" className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition" onClick={() => setIsMenuOpen(false)}>
                Vets
              </Link>
              <Link href="/ngos" className="text-sm tracking-wide text-foreground/70 hover:text-foreground boty-transition" onClick={() => setIsMenuOpen(false)}>
                NGOs
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
