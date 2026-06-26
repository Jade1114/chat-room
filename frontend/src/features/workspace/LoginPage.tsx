import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, applyAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const auth = await login(username, password);
      applyAuth(auth);
      navigate({ to: '/activities' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
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
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-accent-strong">校园活动中心</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-strong max-sm:text-3xl">登录活动中心</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
            登录后可以发布活动、管理自己的发布，并进入管理后台。
          </p>
          <div className="mt-8 grid gap-3 text-sm text-muted">
            <div className="flex items-center gap-3 rounded-2xl bg-accent-wash p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent-strong">1</span>
              <span>使用账号登录。</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-info-soft p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-card text-info">2</span>
              <span>发布你想邀请别人一起完成的事情。</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-violet-soft p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-card text-violet">3</span>
              <span>在活动详情中留下参与方式，方便感兴趣的人联系你。</span>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-divider bg-elevated p-5 shadow-panel">
          <div className="border-b border-divider px-2 pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-faint">Sign In</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-strong">登录</h2>
            <p className="mt-2 text-sm text-muted">
              没有账号？{' '}
              <button type="button" onClick={() => navigate({ to: '/register' })} className="font-semibold text-accent hover:underline">
                注册新账号
              </button>
            </p>
          </div>

          {error && <p className="mt-5 rounded-2xl border border-danger-border bg-danger-soft p-4 text-sm text-danger">{error}</p>}

          <form onSubmit={handleLogin} className="mt-5 grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted">账号</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="输入账号"
                className="rounded-xl border border-divider bg-card px-4 py-3 text-sm text-primary outline-none transition focus:border-accent"
                autoComplete="username"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-muted">密码</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="输入密码"
                className="rounded-xl border border-divider bg-card px-4 py-3 text-sm text-primary outline-none transition focus:border-accent"
                autoComplete="current-password"
              />
            </label>
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-on-accent transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
