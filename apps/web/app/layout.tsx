import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/theme";
import { OnboardingProvider } from "@/components/onboarding";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chimera - AI Agent Orchestration",
  description: "Digital Command Center for autonomous AI operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <OnboardingProvider>
            {children}
          </OnboardingProvider>
          <Toaster />
          <SonnerToaster
            position="bottom-right"
            toastOptions={{
              className: "border shadow-lg",
            }}
            richColors
            closeButton
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
