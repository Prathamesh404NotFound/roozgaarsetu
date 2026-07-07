import { ShieldCheck, ShieldAlert, Phone, FileCheck, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerificationTier = "unverified" | "phone_verified" | "id_verified" | "skill_verified";

interface VerificationBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  status?: VerificationTier | boolean;
}

export const VerificationBadge = ({ className, size = "md", status = "skill_verified" }: VerificationBadgeProps) => {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  // Convert boolean to appropriate tier
  const tier: VerificationTier = typeof status === "boolean" 
    ? (status ? "skill_verified" : "unverified") 
    : status;

  const config = {
    unverified: {
      icon: ShieldAlert,
      text: "Unverified",
      classes: "bg-muted text-muted-foreground border-muted-foreground/20",
    },
    phone_verified: {
      icon: Phone,
      text: "Phone Verified",
      classes: "bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-900/50",
    },
    id_verified: {
      icon: FileCheck,
      text: "ID Verified",
      classes: "bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-900/50",
    },
    skill_verified: {
      icon: CheckCircle,
      text: "Skill Verified",
      classes: "bg-success/10 text-success border-success-200",
    },
  };

  const current = config[tier] || config.unverified;
  const Icon = current.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 shadow-sm",
        current.classes,
        className
      )}
    >
      <Icon className={sizeClasses[size]} />
      <span className="font-heading tracking-wide">{current.text}</span>
    </div>
  );
};
