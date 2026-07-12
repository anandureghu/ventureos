import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VentureOS — the operating system for founders",
    short_name: "VentureOS",
    description:
      "Track every business idea, its stage, tasks, money, and next action in one command center.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#0D0F16",
    theme_color: "#0D0F16",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
