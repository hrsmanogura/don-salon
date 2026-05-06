import type { Metadata } from "next";
import "./globals.css";
import AppShell from "./AppShell";

export const metadata: Metadata = {
  title: "Salon Payroll",
  description: "Weekly payroll management for salon employees",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // children is the page.tsx output — but we render AppShell as the main container
  // and let AppShell handle routing between tabs.
  void children; // suppress unused warning
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <AppShell />
      </body>
    </html>
  );
}
