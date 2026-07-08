import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, MessageCircle, Briefcase, LogOut, LayoutDashboard, Settings, LogIn, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFirebase } from "@/context/FirebaseContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

import { Logo } from "@/components/ui/Logo";

// ── Helper: derive initials from a display name ───────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "U").toUpperCase();
}

// ── Language config ────────────────────────────────────────────────────────────
const LANGS = [
  { code: "en", label: "EN", full: "English" },
  { code: "hi", label: "हिं", full: "हिंदी" },
  { code: "mr", label: "मर", full: "मराठी" },
];

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const location = useLocation();
  const { user, userProfile, loading, signInWithGoogle, signOut, isClient, isWorker, isAdmin } = useFirebase();
  const { t, i18n } = useTranslation();

  // Reset image error when user changes
  useEffect(() => {
    if (user?.photoURL) {
      setImageLoadError(false);
    }
  }, [user?.photoURL]);

  const getDashboardHref = () => {
    if (isAdmin) return "/admin";
    if (isWorker) return "/dashboard/worker";
    return "/dashboard/client";
  };

  const getProfileHref = () => {
    if (isWorker) return "/profile/worker";
    return "/profile/client";
  };

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("rs_lang", code);
  };

  const currentLang = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/services", label: t("nav.services") },
    { href: "/workers", label: t("nav.findHelp") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  // Avatar component with Google profile image and initials fallback
  const UserAvatar = ({ className = "" }: { className?: string }) => {
    const displayName = user?.displayName || user?.email || 'User';
    const initials = getInitials(displayName);
    const hasPhoto = user?.photoURL && !imageLoadError;

    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden",
          className
        )}
      >
        {hasPhoto ? (
          <img
            src={user.photoURL}
            alt={displayName}
            className="h-full w-full object-cover"
            onError={() => setImageLoadError(true)}
          />
        ) : (
          <span className="font-heading font-bold text-primary text-sm">
            {initials}
          </span>
        )}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Logo className="h-9 w-9 shrink-0" />
          <div className="flex flex-col">
            <span className="font-heading text-base sm:text-lg font-bold leading-tight text-primary">
              RoozgaarSetu
            </span>
            <span className="hidden sm:block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Professional Network
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/5 hover:text-primary",
                location.pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="tel:+919876543210"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden lg:inline">{t("nav.callUs")}</span>
          </a>
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-success transition-colors hover:text-success/80"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden lg:inline">WhatsApp</span>
          </a>

          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted/40 transition">
                <Globe className="h-3.5 w-3.5" />
                {currentLang.label}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-xl">
              {LANGS.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={cn(
                    "cursor-pointer text-sm",
                    i18n.language === lang.code && "font-bold text-primary"
                  )}
                >
                  <span className="mr-2 font-bold w-6 inline-block">{lang.label}</span>
                  {lang.full}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              {/* Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-9 w-9 rounded-full outline-none ring-primary/20 transition hover:ring-4 focus-visible:ring-4">
                    <UserAvatar className="h-9 w-9" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl shadow-elevated">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">{user.displayName || user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      <p className="text-[10px] uppercase font-bold text-primary mt-1">{userProfile?.role || 'user'}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link to={getDashboardHref()} className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      <span>{isAdmin ? t("nav.adminPanel") : t("nav.dashboard")}</span>
                    </Link>
                  </DropdownMenuItem>

                  {!isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to={getProfileHref()} className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span>{t("nav.profileSettings")}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t("nav.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => signInWithGoogle()} className="flex items-center gap-2" size="sm" disabled={loading}>
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.signIn")}</span>
              <span className="sm:hidden">Sign In</span>
            </Button>
          )}
        </div>

        {/* Mobile: language + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Compact language toggle on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted/40 transition">
                <Globe className="h-3.5 w-3.5" />
                {currentLang.label}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 rounded-xl">
              {LANGS.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={cn("cursor-pointer text-sm", i18n.language === lang.code && "font-bold text-primary")}
                >
                  <span className="mr-2 font-bold">{lang.label}</span> {lang.full}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border md:hidden"
          >
            <nav className="container flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "rounded-md px-4 py-3 text-sm font-medium transition-colors",
                    location.pathname === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                {user ? (
                  <>
                    {/* User info */}
                    <div className="flex items-center gap-3 px-2 py-1">
                      <UserAvatar className="h-10 w-10 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{user.displayName || user.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{t("nav.loggedInAs")} {userProfile?.role || 'user'}</p>
                      </div>
                    </div>

                    {/* Dashboard Link */}
                    <Link
                      to={getDashboardHref()}
                      onClick={() => setIsOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted/55 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {isAdmin ? t("nav.adminPanel") : t("nav.dashboard")}
                    </Link>

                    {!isAdmin && (
                      <Link
                        to={getProfileHref()}
                        onClick={() => setIsOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted/55 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        {t("nav.profileSettings")}
                      </Link>
                    )}

                    <Button
                      variant="destructive"
                      onClick={() => { setIsOpen(false); signOut(); }}
                      className="w-full"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("nav.logout")}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => { setIsOpen(false); signInWithGoogle(); }}
                    className="w-full"
                    disabled={loading}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {t("nav.signIn")}
                  </Button>
                )}

                <div className="flex gap-2 mt-2">
                  <a
                    href="tel:+919876543210"
                    className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-medium"
                  >
                    <Phone className="h-4 w-4" />
                    {t("nav.callUs")}
                  </a>
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-md bg-success py-2.5 text-sm font-medium text-success-foreground"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
