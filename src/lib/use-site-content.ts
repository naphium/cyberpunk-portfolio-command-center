import { useEffect } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPublicContent } from "@/lib/content.functions";

export const contentQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getPublicContent(),
  staleTime: 30_000,
});

export function useSiteContent(initial: Awaited<ReturnType<typeof getPublicContent>>) {
  const qc = useQueryClient();
  const q = useQuery({ ...contentQuery, initialData: initial });

  // Live updates: any publish from the admin panel refreshes every open visitor.
  useEffect(() => {
    const ch = supabase
      .channel(`site-content-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "site_content" }, () => {
        void qc.invalidateQueries({ queryKey: contentQuery.queryKey });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [qc]);

  return q.data;
}
