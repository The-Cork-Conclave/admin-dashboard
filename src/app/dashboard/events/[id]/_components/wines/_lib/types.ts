export const WINE_COLORS = ["Red", "White", "Rosé", "Sparkling", "Dessert", "Fortified"] as const;

export type WineColor = (typeof WINE_COLORS)[number];
