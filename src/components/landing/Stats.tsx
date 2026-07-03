const stats = [
  { value: "100K+", label: "Businesses served" },
  { value: "60M+", label: "Posts shared" },
  { value: "130M+", label: "Users engaged" },
  { value: "163+", label: "Countries" },
];

export function Stats() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-4 rounded-3xl bg-primary p-8 shadow-[var(--shadow-soft)] sm:grid-cols-2 lg:grid-cols-4 lg:p-10">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl font-bold text-primary-foreground sm:text-4xl">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-primary-foreground/70">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
