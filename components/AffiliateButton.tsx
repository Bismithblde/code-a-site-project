import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface AffiliateButtonProps {
  brandSlug: string;
  priceRange?: string;
  className?: string;
  variant?: "default" | "compact";
}

export function AffiliateButton({
  brandSlug,
  priceRange,
  className = "",
  variant = "default",
}: AffiliateButtonProps) {
  if (variant === "compact") {
    return (
      <Link
        href={`/go/${brandSlug}`}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors ${className}`}
      >
        <ExternalLink className="size-3.5" />
        Amazon
      </Link>
    );
  }

  return (
    <Link
      href={`/go/${brandSlug}`}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition ${className}`}
    >
      Check on Amazon
      {priceRange && <span className="opacity-80">&middot; {priceRange}</span>}
      <ExternalLink className="size-4" />
    </Link>
  );
}
