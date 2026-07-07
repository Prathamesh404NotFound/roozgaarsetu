import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Phone, MessageCircle, Briefcase, User, LogOut, LayoutDashboard, Settings, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/Auth/AuthProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/workers", label: "Find Help" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { profile, loginWithGoogle, logout } = useAuth();

  const isClient = profile?.role === "client";
  const isWorker = profile?.role === "worker";
  const isAdmin = profile?.role === "admin";

  const getDashboardHref = () => {
    if (isAdmin) return "/admin";
    if (isWorker) return "/dashboard/worker";
    return "/dashboard/client";
  };

  const getProfileHref = () => {
    if (isWorker) return "/profile/worker";
    return "/profile/client";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="font-heading text-lg font-bold text-primary-foreground">R</span>
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold leading-tight text-primary">
              RoozgaarSetu
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Professional Network
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/5 hover:text-primary",
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
        <div className="hidden items-center gap-4 md:flex">
          <a
            href="tel:+919876543210"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <Phone className="h-4 w-4" />
            <span className="hidden lg:inline">Call Us</span>
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

          {profile ? (
            <>
              {/* Become a Worker — visible only for clients */}
              {isClient && (
                <Link
                  to="/become-worker"
                  className="flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Briefcase className="h-4 w-4" />
                  Become a Worker
                </Link>
              )}

              {/* Book Now Button */}
              {isClient && (
                <Button asChild>
                  <Link to="/booking">Book Now</Link>
                </Button>
              )}

              {/* Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-9 w-9 rounded-full outline-none ring-primary/20 transition hover:ring-4 focus-visible:ring-4">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {(profile.displayName ?? "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56 mt-1 rounded-xl shadow-elevated">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">{profile.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{profile.email}</p>
                      <p className="text-[10px] uppercase font-bold text-primary mt-1">{profile.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Dashboard link */}
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardHref()} className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                      <span>{isAdmin ? "Admin Panel" : "Dashboard"}</span>
                    </Link>
                  </DropdownMenuItem>

                  {/* Client Become Worker flow */}
                  {isClient && (
                    <DropdownMenuItem asChild>
                      <Link to="/become-worker" className="flex items-center gap-2 cursor-pointer">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>Become a Worker</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {/* Profile link — not needed for admin */}
                  {!isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to={getProfileHref()} className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => loginWithGoogle()} className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign in with Google
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg md:hidden"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
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
                {profile ? (
                  <>
                    {/* Role Label */}
                    <div className="px-4 py-1.5 text-xs font-semibold uppercase text-primary bg-primary/5 rounded-lg text-center">
                      Logged in as: {profile.role}
                    </div>

                    {/* Dashboard Link */}
                    <Link
                      to={getDashboardHref()}
                      onClick={() => setIsOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted/55 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {isAdmin ? "Admin Panel" : "Dashboard"}
                    </Link>

                    {/* Become a Worker — mobile, clients only */}
                    {isClient && (
                      <Link
                        to="/become-worker"
                        onClick={() => setIsOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary py-2.5 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Briefcase className="h-4 w-4" />
                        Become a Worker
                      </Link>
                    )}

                    {/* Profile settings */}
                    {!isAdmin && (
                      <Link
                        to={getProfileHref()}
                        onClick={() => setIsOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-muted/55 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Profile Settings
                      </Link>
                    )}

                    {/* Book Now */}
                    {isClient && (
                      <Button asChild className="w-full">
                        <Link to="/booking" onClick={() => setIsOpen(false)}>
                          Book Now
                        </Link>
                      </Button>
                    )}

                    {/* Logout */}
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsOpen(false);
                        logout();
                      }}
                      className="w-full"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      loginWithGoogle();
                    }}
                    className="w-full"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in with Google
                  </Button>
                )}

                <div className="flex gap-2 mt-2">
                  <a
                    href="tel:+919876543210"
                    className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-medium"
                  >
                    <Phone className="h-4 w-4" />
                    Call
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
