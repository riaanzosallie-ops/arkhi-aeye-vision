import { supabase } from "@/integrations/supabase/client";

export type UploadResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

export async function uploadUserFile(bucket: string, file: File): Promise<UploadResult> {
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return { ok: false, error: "Sign in to upload to cloud." };
  const ext = file.name.split(".").pop() || "bin";
  const path = `${uid}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
  if (error) return { ok: false, error: error.message };
  return { ok: true, path };
}
