import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const VerificationBadge = ({ className, size = "md" }: VerificationBadgeProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-success",
        className
      )}
    >
      <ShieldCheck className={sizeClasses[size]} />
      <span className="text-xs font-medium">Verified</span>
    </div>
  );
};
