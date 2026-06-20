interface OnlineMemberListProps {
  count: number;
  loading: boolean;
  users: string[];
}

export function OnlineMemberList({ count, loading, users }: OnlineMemberListProps) {
  return (
    <aside className="hidden min-h-screen border-l border-white/[0.06] bg-[#0e151e] px-4 py-5 2xl:block">
      <section>
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">在线成员</p>
          <span className="text-xs font-semibold text-emerald-300/70">{count}</span>
        </div>
        <div className="mt-3 grid gap-1">
          {loading && <p className="rounded-xl bg-white/[0.025] p-3 text-xs text-slate-600">正在加载成员...</p>}
          {!loading && users.length === 0 && <p className="rounded-xl bg-white/[0.025] p-3 text-xs text-slate-600">还没有成员在线</p>}
          {users.map((name, index) => (
            <div key={name} className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.035]">
              <div className={`relative grid size-8 place-items-center rounded-lg text-xs font-bold ${index % 2 ? 'bg-violet-300/10 text-violet-300' : 'bg-sky-300/10 text-sky-300'}`}>
                {name.slice(0, 1).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border-2 border-[#0e151e] bg-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-300">{name}</p>
                <p className="mt-0.5 text-[10px] text-slate-600">在线</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
