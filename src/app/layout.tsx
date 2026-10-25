import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VARANASI — Autonomous GPU RunGuard & FinOps Margin Engine",
  description:
    "Autonomous GPU RunGuard & FinOps Margin Engine for Nebius × NVIDIA Global AI Hackathon 2026. Catch failures, protect compute, protect margins.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-app text-text-primary antialiased selection:bg-nvidia-green/25 selection:text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
