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
    <section className="flex min-h-screen items-center justify-center bg-content px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-divider bg-card p-8 shadow-panel max-sm:p-6">
        <div className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
          {icon}
        </div>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-accent-strong">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-strong">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
        <div className="mt-7 border-t border-divider pt-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-faint">计划能力</p>
          <ul className="mt-3 grid gap-2.5">
            {actions.map((action) => (
              <li key={action} className="flex items-center gap-3 text-sm text-subtle">
                <span className="size-1.5 rounded-full bg-accent" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
