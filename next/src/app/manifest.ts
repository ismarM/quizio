import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quizio",
    short_name: "Quizio",
    description:
      "Create, publish and solve focused quiz challenges with clean results tracking.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFAF2",
    theme_color: "#006E5A",
    icons: [
      {
        src: "/icons/quizio-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/quizio-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
