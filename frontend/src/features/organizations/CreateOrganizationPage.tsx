import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createOrganization } from '../../lib/organizationApi';
import { Icon } from '../../components/Icon';

export function CreateOrganizationPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('组织名称不能为空');
      return;
    }

    setSubmitting(true);
    try {
      const org = await createOrganization(trimmedName, description.trim());
      navigate({
        to: '/organizations/$organizationId',
        params: { organizationId: org.id }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-strong">创建组织</h1>
        <p className="mt-2 text-sm text-muted">创建一个新的组织，让成员发现、加入和实时交流。</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="org-name" className="block text-sm font-semibold text-strong">
            组织名称 <span className="text-danger">*</span>
          </label>
          <input
            id="org-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：围棋社、二次元同好会"
            maxLength={64}
            className="mt-2 block w-full rounded-xl border border-divider bg-surface px-4 py-3 text-sm text-primary placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="mt-1 text-xs text-faint">最多 64 个字符</p>
        </div>

        <div>
          <label htmlFor="org-desc" className="block text-sm font-semibold text-strong">
            组织简介
          </label>
          <textarea
            id="org-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="介绍一下这个组织是做什么的..."
            rows={4}
            maxLength={512}
            className="mt-2 block w-full resize-none rounded-xl border border-divider bg-surface px-4 py-3 text-sm text-primary placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <p className="mt-1 text-xs text-faint">最多 512 个字符</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <Icon className="mt-0.5 size-4 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </Icon>
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-on-accent transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? '创建中...' : '创建组织'}
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: '/organizations' })}
            className="rounded-xl border border-divider px-6 py-3 text-sm font-semibold text-primary transition hover:bg-hover"
          >
            取消
          </button>
        </div>
      </form>

      <div className="mt-10 rounded-2xl border border-divider bg-card p-5">
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-faint">创建后立即获得</h3>
        <ul className="mt-4 space-y-3">
          <li className="flex items-start gap-3 text-sm text-muted">
            <Icon className="mt-0.5 size-4 shrink-0 text-accent"><path d="M20 6 9 17l-5-5" /></Icon>
            成为组织的 Organizer
          </li>
          <li className="flex items-start gap-3 text-sm text-muted">
            <Icon className="mt-0.5 size-4 shrink-0 text-accent"><path d="M20 6 9 17l-5-5" /></Icon>
            自动创建默认聊天频道
          </li>
          <li className="flex items-start gap-3 text-sm text-muted">
            <Icon className="mt-0.5 size-4 shrink-0 text-accent"><path d="M20 6 9 17l-5-5" /></Icon>
            公开组织出现在组织发现中心
          </li>
        </ul>
      </div>
    </div>
  );
}
