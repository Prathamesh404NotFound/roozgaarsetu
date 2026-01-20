import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const RatingStars = ({ rating, showValue = true, size = "md", className }: RatingStarsProps) => {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              sizeClasses[size],
              i < fullStars
                ? "fill-gold text-gold"
                : i === fullStars && hasHalfStar
                ? "fill-gold/50 text-gold"
                : "fill-muted/20 text-muted/40"
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className={cn("font-medium text-foreground", textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};
