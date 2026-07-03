import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Card, EmptyState } from "@/components/app/ui";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { Upload, Images, Trash2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/app/library")({ component: Library });

function Library() {
  const { currentWorkspace, canEdit } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const qc = useQueryClient();
  const ref = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});

  const { data = [] } = useQuery({
    queryKey: ["library", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("media_assets").select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!data.length) return;
    (async () => {
      const paths = data.map((a) => a.storage_path);
      const { data: signed } = await supabase.storage.from("media").createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      signed?.forEach((s, i) => { if (s.signedUrl) map[data[i].id] = s.signedUrl; });
      setUrls(map);
    })();
  }, [data]);

  const onUpload = async (files: FileList | null) => {
    if (!files || !wsId) return;
    for (const file of Array.from(files)) {
      const path = `${wsId}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file);
      if (upErr) { toast.error(upErr.message); continue; }
      await supabase.from("media_assets").insert({ workspace_id: wsId, storage_path: path, mime: file.type, size_bytes: file.size });
    }
    toast.success("Uploaded");
    qc.invalidateQueries({ queryKey: ["library", wsId] });
  };

  const remove = async (id: string, path: string) => {
    if (!confirm("Delete this asset?")) return;
    await supabase.storage.from("media").remove([path]);
    await supabase.from("media_assets").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["library", wsId] });
  };

  const filename = (path: string) => path.split("/").pop() || path;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content library</h1>
          <p className="text-sm text-muted-foreground">Reuse media across posts.</p>
        </div>
        {canEdit && (
          <>
            <button onClick={() => ref.current?.click()} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2"><Upload className="h-4 w-4" /> Upload</button>
            <input ref={ref} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => onUpload(e.target.files)} />
          </>
        )}
      </div>

      {data.length === 0 ? (
        <Card><EmptyState icon={Images} title="Nothing uploaded yet" description="Drop images or videos to reuse them anywhere." /></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {data.map((a) => (
            <div key={a.id} className="group relative rounded-2xl overflow-hidden border border-border bg-card aspect-square">
              {urls[a.id] && a.mime?.startsWith("image/") ? (
                <img src={urls[a.id]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center bg-muted text-muted-foreground text-xs p-2 text-center break-all">{filename(a.storage_path)}</div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2">
                <p className="text-white text-[11px] truncate">{filename(a.storage_path)}</p>
                <p className="text-white/70 text-[10px]">{fmtDate(a.created_at, "P")}</p>
                {canEdit && <button onClick={() => remove(a.id, a.storage_path)} className="absolute top-2 right-2 p-1 rounded-md bg-black/50 text-white"><Trash2 className="h-3 w-3" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
