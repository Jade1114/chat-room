interface OnlineMemberListProps {
  count: number;
  loading: boolean;
  users: string[];
  sidebar?: boolean;
}

export function OnlineMemberList({ count, loading, users, sidebar = true }: OnlineMemberListProps) {
  const asideClasses = sidebar
    ? "hidden min-h-screen border-l border-divider bg-sidebar px-4 py-5 2xl:block"
    : "px-4 py-5";

  return (
    <aside className={asideClasses}>
      <section>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-faint">在线成员</p>
          <span className="text-xs font-semibold text-accent-strong">{count}</span>
        </div>
        <div className="mt-3 grid gap-1">
          {loading && <p className="rounded-xl bg-hover p-3 text-xs text-faint">正在加载成员...</p>}
          {!loading && users.length === 0 && <p className="rounded-xl bg-hover p-3 text-xs text-faint">还没有成员在线</p>}
          {users.map((name, index) => (
            <div key={name} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-hover">
              <div className={`relative grid size-8 place-items-center rounded-lg text-xs font-bold ${index % 2 ? 'bg-violet-soft text-violet' : 'bg-info-soft text-info'}`}>
                {name.slice(0, 1).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-sidebar bg-online" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-primary">{name}</p>
                <p className="mt-0.5 text-[10px] text-faint">在线</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
