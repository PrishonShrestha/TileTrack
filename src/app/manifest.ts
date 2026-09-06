import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TileTrack - Tile & Inventory Management",
    short_name: "TileTrack",
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#061614",
    theme_color: "#10b981",
    orientation: "portrait",
    categories: ["productivity", "utilities", "business"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Floor Calculator",
        short_name: "Floor",
        description: "Calculate floor tiles and boxes",
        url: "/calculator/floor",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Wall Calculator",
        short_name: "Wall",
        description: "Calculate wall tiles with openings",
        url: "/calculator/wall",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Kitchen Calculator",
        short_name: "Kitchen",
        description: "Countertop and backsplash calculator",
        url: "/calculator/kitchen",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Bathroom Calculator",
        short_name: "Bathroom",
        description: "Combined bathroom floor and wall calculator",
        url: "/calculator/bathroom",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Product Catalog",
        short_name: "Catalog",
        description: "Browse tile and marble catalog",
        url: "/manage/catalog",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Stock Management",
        short_name: "Stock",
        description: "Track inventory and box stocks",
        url: "/manage/stock",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
