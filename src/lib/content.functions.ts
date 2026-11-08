import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { mergeData, type SiteData } from "@/lib/content";
import { adminKey, passwordMatches, sessionSecret, sha256Hex, signToken, verifyToken } from "@/lib/admin-token";

// Only ADMIN_PASSWORD is required at runtime. Backend URL/key fall back to the
// build-time public values, so hosts like Vercel need no extra variables.
const TOKEN_TTL = 60 * 60 * 12; // 12 hours

function backend() {
  const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  return { url: String(url ?? ""), key: String(key ?? "") };
}

function publicClient() {
  const { url, key } = backend();
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

let keySynced = false;
/** Where the private service key exists (Lovable hosting), store the hash of the admin write key. */
async function syncAdminKey() {
  const pw = process.env["ADMIN_PASSWORD"];
  if (keySynced || !pw || !process.env["SUPABASE_SERVICE_ROLE_KEY"]) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const key_hash = await sha256Hex(await adminKey(pw));
    const { error } = await supabaseAdmin.from("admin_auth").upsert({ id: 1, key_hash, updated_at: new Date().toISOString() });
    if (!error) keySynced = true;
  } catch (e) {
    console.error("syncAdminKey failed", e);
  }
}

async function assertAdmin(token: string | undefined) {
  const pw = process.env["ADMIN_PASSWORD"];
  const secret = await sessionSecret(process.env["ADMIN_SESSION_SECRET"], pw);
  if (!secret || !pw) throw new Error("Admin is not configured");
  if (!(await verifyToken(secret, token))) throw new Error("Unauthorized");
  await syncAdminKey();
  return adminKey(pw);
}

function rpcError(e: { message?: string } | null, fallback: string) {
  if (e?.message?.includes("unauthorized")) return new Error("Password does not match the main site's ADMIN_PASSWORD");
  return new Error(fallback);
}

export const getPublicContent = createServerFn({ method: "GET" }).handler(async (): Promise<{ data: SiteData; updatedAt: string | null }> => {
  void syncAdminKey();
  try {
    const { data, error } = await publicClient().from("site_content").select("data, updated_at").eq("id", "main").maybeSingle();
    if (error) throw error;
    return { data: mergeData(data?.data ?? {}), updatedAt: data?.updated_at ?? null };
  } catch (e) {
    console.error("getPublicContent failed", e);
    return { data: mergeData({}), updatedAt: null };
  }
});

export const adminLogin = createServerFn({ method: "POST" })
  .validator((input: { password: string }) => ({ password: String(input?.password ?? "").slice(0, 512) }))
  .handler(async ({ data }) => {
    const expected = process.env["ADMIN_PASSWORD"];
    const secret = await sessionSecret(process.env["ADMIN_SESSION_SECRET"], expected);
    if (!expected || !secret) return { ok: false as const, error: "Admin password is not configured." };
    if (!(await passwordMatches(data.password, expected))) {
      await new Promise((r) => setTimeout(r, 400));
      return { ok: false as const, error: "Access denied." };
    }
    await syncAdminKey();
    return { ok: true as const, token: await signToken(secret, TOKEN_TTL) };
  });

export const verifyAdmin = createServerFn({ method: "POST" })
  .validator((input: { token: string }) => ({ token: String(input?.token ?? "") }))
  .handler(async ({ data }) => {
    const secret = await sessionSecret(process.env["ADMIN_SESSION_SECRET"], process.env["ADMIN_PASSWORD"]);
    if (!secret) return { ok: false };
    return { ok: await verifyToken(secret, data.token) };
  });

export const saveContent = createServerFn({ method: "POST" })
  .validator((input: { token: string; content: unknown }) => {
    const json = JSON.stringify(input?.content ?? {});
    if (json.length > 2_000_000) throw new Error("Content too large");
    return { token: String(input?.token ?? ""), content: JSON.parse(json) as unknown };
  })
  .handler(async ({ data }) => {
    const key = await assertAdmin(data.token);
    const content = JSON.parse(JSON.stringify(mergeData(data.content)));
    const { data: ts, error } = await publicClient().rpc("admin_save_content", { p_key: key, p_data: content });
    if (error) {
      console.error("saveContent failed", error);
      throw rpcError(error, "Could not save content");
    }
    return { ok: true, updatedAt: String(ts ?? new Date().toISOString()) };
  });

const ALLOWED_TYPES = /^(image\/(png|jpeg|webp|gif|svg\+xml|avif)|audio\/(mpeg|mp3|ogg|wav|x-wav|webm|aac|mp4|x-m4a|flac))$/;

/** Issues a one-time upload slot; the browser then uploads the file straight to storage. */
export const createUpload = createServerFn({ method: "POST" })
  .validator((input: { token: string; name: string; type: string }) => {
    if (!ALLOWED_TYPES.test(String(input?.type ?? ""))) throw new Error("Unsupported file type");
    return {
      token: String(input.token ?? ""),
      name: String(input.name ?? "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file",
    };
  })
  .handler(async ({ data }) => {
    const key = await assertAdmin(data.token);
    const path = `${Date.now()}-${data.name}`;
    const { error } = await publicClient().rpc("admin_create_upload_ticket", { p_key: key, p_path: path });
    if (error) {
      console.error("createUpload failed", error);
      throw rpcError(error, "Upload failed");
    }
    return { path };
  });

export const deleteGuestbookEntry = createServerFn({ method: "POST" })
  .validator((input: { token: string; id: string }) => ({ token: String(input?.token ?? ""), id: String(input?.id ?? "") }))
  .handler(async ({ data }) => {
    const key = await assertAdmin(data.token);
    const { error } = await publicClient().rpc("admin_delete_guestbook", { p_key: key, p_id: data.id });
    if (error) throw rpcError(error, "Delete failed");
    return { ok: true };
  });
