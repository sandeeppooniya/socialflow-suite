import { format, formatDistanceToNow, parseISO } from "date-fns";

export const fmtDate = (d: string | Date | null | undefined, fmt = "PP p") =>
  d ? format(typeof d === "string" ? parseISO(d) : d, fmt) : "—";

export const fmtRelative = (d: string | Date | null | undefined) =>
  d ? formatDistanceToNow(typeof d === "string" ? parseISO(d) : d, { addSuffix: true }) : "—";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
