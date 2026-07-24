import { createClient } from "@/lib/supabase/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id")!);
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const { data: versions } = await supabase
    .from("submission_versions")
    .select("id, version_number, notes, created_at, submission_files ( id, file_name, file_url, file_size, storage_path )")
    .eq("submission_id", id)
    .order("version_number", { ascending: false })
    .limit(10);

  const { data: approvals } = await supabase
    .from("approvals")
    .select("id, step_number, step_role, status, remarks, created_at")
    .eq("submission_id", id)
    .order("created_at", { ascending: false });

  return Response.json({ versions: versions ?? [], approvals: approvals ?? [] });
}