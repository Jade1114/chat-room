import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { useAuth } from '../../hooks/useAuth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, applyAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!username || !displayName || !password) {
      setError('请填写所有字段');
      return;
    }
    setLoading(true);
    try {
      const auth = await register(username, displayName, password);
      applyAuth(auth);
      navigate({ to: '/activities' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-app px-5 py-8 text-primary">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-divider bg-card p-8 shadow-panel">
          <div className="grid size-14 place-items-center rounded-2xl bg-accent text-on-accent shadow-accent">
            <Icon className="size-7"><path d="M3 21h18" /><path d="M6 21V9l6-4 6 4v12" /><path d="M9 21v-5h6v5" /><path d="M9 11h.01M15 11h.01" /></Icon>
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-accent-strong">Get Started</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-strong max-sm:text-3xl">注册组织平台账号</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
            注册后默认加入 Public Square。后续加入更多组织后，对应组织的默认频道会出现在你的频道列表中。
          </p>
        </section>

        <section className="rounded-[2rem] border border-divider bg-elevated p-5 shadow-panel">
          <div className="border-b border-divider px-2 pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-faint">Register</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-strong">创建账号</h2>
            <p className="mt-2 text-sm text-muted">
              已有账号？{' '}
              <button type="button" onClick={() => navigate({ to: '/login' })} className="font-semibold text-accent hover:underline">
                返回登录
              </button>
            </p>
          </div>

          {error && <p className="mt-5 rounded-2xl border border-danger-border bg-danger-soft p-4 text-sm text-danger">{error}</p>}

          <form onSubmit={handleRegister} className="mt-5 grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted">账号</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="20240101001"
                className="rounded-xl border border-divider bg-card px-4 py-3 text-sm text-primary outline-none transition focus:border-accent"
                autoComplete="username"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted">显示名</span>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="张三"
                className="rounded-xl border border-divider bg-card px-4 py-3 text-sm text-primary outline-none transition focus:border-accent"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted">密码</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="不少于 6 位"
                className="rounded-xl border border-divider bg-card px-4 py-3 text-sm text-primary outline-none transition focus:border-accent"
                autoComplete="new-password"
              />
            </label>
            <button
              type="submit"
              disabled={loading || !username || !displayName || !password}
              className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-on-accent transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
