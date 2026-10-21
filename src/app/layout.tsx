import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BNH Portfolio Intelligence",
  description: "Portfolio reporting and compliance intelligence for Brendan Nicholas Holdings.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
