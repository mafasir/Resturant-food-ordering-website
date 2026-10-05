import {
  Beef,
  CakeSlice,
  Coffee,
  CookingPot,
  CupSoda,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/**
 * Category icons are stored as plain strings in the database so admins can
 * change them without a migration. This maps those names onto components and
 * falls back to a neutral icon for unknown values.
 */
const ICONS: Record<string, LucideIcon> = {
  Beef,
  CakeSlice,
  Coffee,
  CookingPot,
  CupSoda,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Utensils: UtensilsCrossed,
  UtensilsCrossed,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? UtensilsCrossed;
  return <Icon className={className} aria-hidden />;
}

export const CATEGORY_ICON_CHOICES = Object.keys(ICONS);
