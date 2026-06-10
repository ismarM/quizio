import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/quizzes", "/about", "/terms", "/privacy"].map((path) => ({
    url: new URL(path, baseUrl).toString(),
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/quizzes" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/quizzes" ? 0.9 : 0.5,
  }));
}
