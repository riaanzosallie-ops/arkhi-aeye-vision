import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, { url: string; exp: number }>();

export async function signedRoomUrl(path: string, bucket = "room-photos"): Promise<string | null> {
  if (!path) return null;
  const key = `${bucket}/${path}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.exp > now) return cached.url;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return null;
  cache.set(key, { url: data.signedUrl, exp: now + 55 * 60 * 1000 });
  return data.signedUrl;
}
