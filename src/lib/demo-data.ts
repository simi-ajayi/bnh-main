import type { PortfolioUpdateInput } from "@/lib/validation";

export type PortfolioUpdate = PortfolioUpdateInput & {
  id: string;
  ownerEmail: string;
  submittedAt: string;
};

export type RagStatus = PortfolioUpdate["ragStatus"];

export function formatNaira(value: number, compact = false) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    notation: compact ? "compact" : "standard",
  }).format(value);
}
