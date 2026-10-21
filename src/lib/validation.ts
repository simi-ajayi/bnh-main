import { z } from "zod";

export const portfolioUpdateSchema = z.object({
  portfolioName: z.string().trim().min(2, "Select a portfolio."),
  reportingMonth: z.string().regex(/^\d{4}-\d{2}$/, "Select a reporting month."),
  cashPosition: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number({ error: "Enter the closing cash position." }).min(0, "Cash position cannot be negative."),
  ),
  ragStatus: z.enum(["Green", "Amber", "Red"]),
  blocker: z.string().trim().min(10, "Give enough detail for the CoS to act.").max(280),
});

export type PortfolioUpdateInput = z.infer<typeof portfolioUpdateSchema>;
