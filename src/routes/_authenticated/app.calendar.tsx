import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { Card } from "@/components/app/ui";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PostRow = { id: string; caption: string; status: string; scheduled_at: string | null };

export const Route = createFileRoute("/_authenticated/app/calendar")({ component: CalendarPage });

function startOfMonthGrid(d: Date) {
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return start;
}

function CalendarPage() {
  const { currentWorkspace, canEdit } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(new Date());
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const gridStart = useMemo(() => startOfMonthGrid(cursor), [cursor]);
  const gridEnd = useMemo(() => { const e = new Date(gridStart); e.setDate(gridStart.getDate() + 42); return e; }, [gridStart]);

  const { data: posts = [] } = useQuery<PostRow[]>({
    queryKey: ["cal-posts", wsId, gridStart.toISOString()],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("id, caption, status, scheduled_at").eq("workspace_id", wsId!).gte("scheduled_at", gridStart.toISOString()).lt("scheduled_at", gridEnd.toISOString()).not("scheduled_at", "is", null);
      return (data ?? []) as PostRow[];
    },
  });

  const byDay = useMemo(() => {
    const map = new Map<string, PostRow[]>();
    posts.forEach((p) => {
      if (!p.scheduled_at) return;
      const key = new Date(p.scheduled_at).toDateString();
      map.set(key, [...(map.get(key) ?? []), p]);
    });
    return map;
  }, [posts]);

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || !canEdit) return;
    const postId = String(e.active.id);
    const dayIso = String(e.over.id);
    const post = posts.find((p) => p.id === postId);
    if (!post || !post.scheduled_at) return;
    const orig = new Date(post.scheduled_at);
    const target = new Date(dayIso);
    target.setHours(orig.getHours(), orig.getMinutes(), 0, 0);
    const { error } = await supabase.from("posts").update({ scheduled_at: target.toISOString() }).eq("id", postId);
    if (error) toast.error(error.message);
    else { toast.success("Rescheduled"); qc.invalidateQueries({ queryKey: ["cal-posts"] }); }
  };

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); days.push(d); }

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">Drag to reschedule.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
          <span className="font-medium text-sm w-40 text-center">{monthLabel}</span>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 rounded-lg hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => setCursor(new Date())} className="ml-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Today</button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="px-2 py-2 text-xs font-semibold text-muted-foreground text-center">{d}</div>
          ))}
        </div>
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((d) => (
              <DayCell key={d.toDateString()} date={d} inMonth={d.getMonth() === cursor.getMonth()} posts={byDay.get(d.toDateString()) ?? []} />
            ))}
          </div>
        </DndContext>
      </Card>
    </div>
  );
}

function DayCell({ date, inMonth, posts }: { date: Date; inMonth: boolean; posts: PostRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: date.toISOString() });
  const today = new Date().toDateString() === date.toDateString();
  return (
    <div ref={setNodeRef} className={`min-h-[110px] border-r border-b border-border p-1.5 ${!inMonth ? "bg-muted/30" : ""} ${isOver ? "bg-primary-soft/60" : ""}`}>
      <div className={`text-[11px] font-semibold mb-1 ${today ? "text-primary" : inMonth ? "text-foreground" : "text-muted-foreground"}`}>{date.getDate()}</div>
      <div className="space-y-1">
        {posts.map((p) => <DraggablePost key={p.id} post={p} />)}
      </div>
    </div>
  );
}

function DraggablePost({ post }: { post: PostRow }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: post.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const color = post.status === "published" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : post.status === "failed" ? "bg-red-500/15 text-red-700 dark:text-red-300" : "bg-primary-soft text-primary";
  return (
    <Link to="/app/composer" search={{ id: post.id }}>
      <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium truncate cursor-grab ${color} ${isDragging ? "opacity-50" : ""}`}>
        {post.scheduled_at && new Date(post.scheduled_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · {post.caption?.slice(0, 20) || "Post"}
      </div>
    </Link>
  );
}
