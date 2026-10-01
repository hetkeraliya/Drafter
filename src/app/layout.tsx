import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { DeskAssist } from "@/components/DeskAssist";
import { PwaRegister } from "@/components/PwaRegister";
import { UndoBar } from "@/components/UndoBar";
import { StoreProvider } from "@/lib/store";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

export const metadata: Metadata = {
  applicationName: "Draftr",
  title: "Draftr",
  description: "A quiet notes app for text, lists, photos, voice, and files.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Draftr",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#F4F5F7",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased`}>
        <StoreProvider>
          <PwaRegister />
          <main className="min-h-dvh">{children}</main>
          <UndoBar />
          <DeskAssist />
        </StoreProvider>
      </body>
    </html>
  );
}
