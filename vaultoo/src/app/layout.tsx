import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Vaultoo | Enterprise Access Orchestrator",
  description:
    "Secure, time-limited access sharing with real-time monitoring and AI-powered threat detection.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-[#030014] text-white`}
      >
        <ThemeProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
