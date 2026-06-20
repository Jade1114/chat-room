import type { ReactNode } from 'react';

interface FeaturePlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  actions: string[];
}

export function FeaturePlaceholderPage({ eyebrow, title, description, icon, actions }: FeaturePlaceholderPageProps) {
  return (
    <section className="flex min-h-screen items-center justify-center bg-[#101821] px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-white/[0.07] bg-[#0d151e] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.18)] max-sm:p-6">
        <div className="grid size-12 place-items-center rounded-2xl bg-emerald-300/[0.08] text-emerald-300">
          {icon}
        </div>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/60">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
        <div className="mt-7 border-t border-white/[0.06] pt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">计划能力</p>
          <ul className="mt-3 grid gap-2.5">
            {actions.map((action) => (
              <li key={action} className="flex items-center gap-3 text-sm text-slate-400">
                <span className="size-1.5 rounded-full bg-emerald-300/60" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
