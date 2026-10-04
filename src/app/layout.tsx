import type { Metadata, Viewport } from "next";
import "@fontsource-variable/schibsted-grotesk";
import "./globals.css";
import { DeskAssist } from "@/components/DeskAssist";
import { NavBridge } from "@/components/NavBridge";
import { PwaRegister } from "@/components/PwaRegister";
import { UndoBar } from "@/components/UndoBar";
import { StoreProvider } from "@/lib/store";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eeeef0" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
  colorScheme: "light dark",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

// Runs before first paint so a saved Light/Dark choice never flashes the wrong theme.
const THEME_BOOT = `try{var p=JSON.parse(localStorage.getItem("draftr.prefs.v8")||"{}");if(p.theme==="light"||p.theme==="dark"){document.documentElement.dataset.theme=p.theme;var c=p.theme==="dark"?"#0b0b0c":"#eeeef0";document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",c)})}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="antialiased">
        <div className="ambient" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <StoreProvider>
          <PwaRegister />
          <NavBridge />
          <main className="min-h-dvh">{children}</main>
          <UndoBar />
          <DeskAssist />
        </StoreProvider>
      </body>
    </html>
  );
}
