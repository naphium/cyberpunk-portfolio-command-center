import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getPublicContent } from "@/lib/content.functions";
import { mergeData, type SiteData } from "@/lib/content";
import { useSiteContent } from "@/lib/use-site-content";
import { Portfolio } from "@/components/portfolio/Portfolio";

export const Route = createFileRoute("/")({
  loader: () => getPublicContent(),
  head: ({ loaderData }) => {
    const p = loaderData?.data.profile;
    const title = p ? `${p.name} (@${p.handle}) — Portfolio & Dashboard` : "Portfolio & Dashboard";
    const description = p?.tagline || "Tactical developer portfolio, projects and live dashboard.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
  component: Index,
});

function Index() {
  const initial = Route.useLoaderData();
  const live = useSiteContent(initial);
  const [draft, setDraft] = useState<SiteData | null>(null);
  const [preview, setPreview] = useState(false);

  // Admin live preview: the CMS iframe posts unsaved drafts here.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("preview") !== "1") return;
    setPreview(true);
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = e.data as { type?: string; data?: unknown };
      if (msg?.type === "hud-preview") setDraft(mergeData(msg.data));
    };
    window.addEventListener("message", onMsg);
    window.parent?.postMessage({ type: "hud-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return <Portfolio data={draft ?? live.data} preview={preview} />;
}
