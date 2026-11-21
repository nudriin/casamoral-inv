import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Casa Moral — 3D Printing Business Management",
    short_name: "Casa Moral",
    description:
      "Sistem manajemen operasional, kalkulasi HPP presisi, Kasir POS, pesanan, stok, dan keuangan usaha 3D printing Casa Moral",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#d97706",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
