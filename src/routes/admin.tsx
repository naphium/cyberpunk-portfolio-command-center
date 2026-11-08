import { createFileRoute } from "@tanstack/react-router";
import { AdminApp } from "@/components/admin/AdminApp";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Control Panel — Nafim Muttaki" },
      { name: "description", content: "Private content management panel for the portfolio." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Admin Control Panel" },
      { property: "og:description", content: "Private content management panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminApp,
});
