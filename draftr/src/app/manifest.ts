import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Draftr",
    short_name: "Draftr",
    description: "A quiet notes app for text, lists, photos, voice, and files.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eeeef0",
    theme_color: "#eeeef0",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
