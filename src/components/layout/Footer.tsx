import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, MessageCircle, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const footerLinks = {
  services: [
    { label: "Cooking", href: "/services?category=cooking" },
    { label: "House Cleaning", href: "/services?category=cleaning" },
    { label: "Childcare", href: "/services?category=childcare" },
    { label: "Elder Care", href: "/services?category=eldercare" },
    { label: "All Services", href: "/services" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Careers", href: "/careers" },
    { label: "Partners", href: "/partners" },
  ],
  support: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Safety Guidelines", href: "/safety" },
    { label: "Blog", href: "/blog" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy", href: "/refunds" },
  ],
};

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/roozgaarsetu", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com/roozgaarsetu", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com/roozgaarsetu", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/roozgaarsetu", label: "LinkedIn" },
];

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="container py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2" title="RoozgaarSetu" aria-label="RoozgaarSetu">
              <Logo className="h-9 w-9 shrink-0" />
              <div className="flex flex-col">
                <span className="font-heading text-lg font-bold leading-tight text-white">
                  RoozgaarSetu
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-white/60">
                  Professional Network
                </span>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-white/70">
              Connecting professionals and opportunities through a trusted network platform.
            </p>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <a
                href="tel:+919876543210"
                className="flex items-center gap-3 text-sm text-white/70 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4" />
                +91 98765 43210
              </a>
              <a
                href="mailto:hello@roozgaarsetu.com"
                className="flex items-center gap-3 text-sm text-white/70 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4" />
                hello@roozgaarsetu.com
              </a>
              <div className="flex items-start gap-3 text-sm text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Kolhapur, Maharashtra, India</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold text-white">Services</h4>
            <ul className="space-y-2.5">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold text-white">Company</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold text-white">Support</h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="mb-4 mt-6 font-heading text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} RoozgaarSetu. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Pilot:</span>
            <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-medium text-gold">
              Kolhapur
            </span>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/919876543210"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-success text-white shadow-lg transition-transform hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </footer>
  );
};
