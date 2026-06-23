import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { currentUserAtom } from '../../state/chatAtoms';
import { getToken } from '../../lib/authApi';

interface AssignedChannel {
  channelId: string;
  channelName: string;
}

interface AdminUser {
  id: string;
  displayName: string;
  role: string;
  schoolId: string | null;
  departmentId: string | null;
  classId: string | null;
  assignedChannels: AssignedChannel[];
}

interface CourseChannel {
  id: string;
  name: string;
  description: string;
}

export function AdminPage() {
  const currentUser = useAtomValue(currentUserAtom);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<CourseChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [actionError, setActionError] = useState('');
  const [orgSchoolId, setOrgSchoolId] = useState('');
  const [orgDeptId, setOrgDeptId] = useState('');
  const [orgClassId, setOrgClassId] = useState('');
  const [orgSaving, setOrgSaving] = useState(false);
  const [orgSaved, setOrgSaved] = useState(false);

  function buildHeaders(): Record<string, string> {
    const token = getToken();
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const h = buildHeaders();
      const [usersRes, coursesRes] = await Promise.all([
        fetch('/api/admin/users', { headers: h }),
        fetch('/api/admin/courses', { headers: h }),
      ]);
      if (!usersRes.ok) throw new Error('加载用户列表失败');
      if (!coursesRes.ok) throw new Error('加载课程列表失败');
      setUsers(await usersRes.json());
      setCourses(await coursesRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const u = users.find(u => u.id === selectedUserId);
    setOrgSchoolId(u?.schoolId || '');
    setOrgDeptId(u?.departmentId || '');
    setOrgClassId(u?.classId || '');
  }, [selectedUserId, users]);

  async function assign(channelId: string) {
    if (!selectedUserId) return;
    setActionError('');
    try {
      const h = buildHeaders();
      const res = await fetch('/api/admin/assign', {
        method: 'POST', headers: h,
        body: JSON.stringify({ userId: selectedUserId, channelId }),
      });
      if (!res.ok) throw new Error('分配失败');
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '分配失败');
    }
  }

  async function unassign(userId: string, channelId: string) {
    setActionError('');
    try {
      const h = buildHeaders();
      const res = await fetch('/api/admin/assign', {
        method: 'DELETE', headers: h,
        body: JSON.stringify({ userId, channelId }),
      });
      if (!res.ok) throw new Error('移除失败');
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '移除失败');
    }
  }

  async function saveOrg() {
    if (!selectedUserId) return;
    setOrgSaving(true);
    setOrgSaved(false);
    setActionError('');
    try {
      const h = buildHeaders();
      const res = await fetch('/api/admin/users/org', {
        method: 'PUT', headers: h,
        body: JSON.stringify({ userId: selectedUserId, schoolId: orgSchoolId || null, departmentId: orgDeptId || null, classId: orgClassId || null }),
      });
      if (!res.ok) throw new Error('保存失败');
      setOrgSaved(true);
      setTimeout(() => setOrgSaved(false), 2000);
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setOrgSaving(false);
    }
  }

  const selectedUser = users.find(u => u.id === selectedUserId);

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-content text-muted text-sm">
        仅管理员可访问此页面。
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-content px-6 py-6 text-primary max-md:px-4">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-[2rem] border border-divider bg-elevated p-7 shadow-panel">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-strong">Admin</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-strong">用户频道管理</h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            为学生和教师分配课程频道的访问权限。分配后，用户即可在侧边栏看到对应课程频道。
          </p>

          {error && (
            <p className="mt-4 rounded-2xl border border-danger-border bg-danger-soft p-4 text-sm text-danger">{error}</p>
          )}
          {actionError && (
            <p className="mt-4 rounded-2xl border border-danger-border bg-danger-soft p-4 text-sm text-danger">{actionError}</p>
          )}

          {loading ? (
            <p className="mt-6 text-sm text-muted">加载中...</p>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              {/* User list */}
              <div className="rounded-[1.5rem] border border-divider bg-card p-4">
                <h2 className="text-sm font-semibold text-strong">用户列表</h2>
                <div className="mt-3 grid gap-1">
                  {users.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        user.id === selectedUserId
                          ? 'bg-accent-soft text-accent-strong'
                          : 'hover:bg-hover text-primary'
                      }`}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-xs font-bold text-accent-strong">
                        {user.displayName.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{user.displayName}</span>
                        <span className="block text-xs text-faint">
                          {user.role === 'ADMIN' ? '管理员' : user.role === 'TEACHER' ? '教师' : '学生'}
                          {' · '}
                          {user.assignedChannels.length} 个课程
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Course assignment panel */}
              <div className="rounded-[1.5rem] border border-divider bg-card p-4">
                {selectedUser ? (
                  <>
                    <h2 className="text-sm font-semibold text-strong">
                      {selectedUser.displayName} 的课程频道
                    </h2>

                    {/* Assigned channels */}
                    <div className="mt-3 grid gap-1">
                      {selectedUser.assignedChannels.map(ch => (
                        <div key={ch.channelId} className="flex items-center gap-3 rounded-xl bg-active px-3 py-2.5">
                          <span className="text-sm font-medium text-primary flex-1 truncate">
                            # {ch.channelName}
                          </span>
                          <button
                            type="button"
                            onClick={() => unassign(selectedUser.id, ch.channelId)}
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-danger transition hover:bg-danger-soft"
                          >
                            移除
                          </button>
                        </div>
                      ))}
                      {selectedUser.assignedChannels.length === 0 && (
                        <p className="px-3 py-4 text-xs text-muted">暂无已分配课程</p>
                      )}
                    </div>

                    {/* Available courses to assign */}
                    <h3 className="mt-5 text-xs font-semibold text-muted">可分配课程</h3>
                    <div className="mt-2 grid gap-1">
                      {courses
                        .filter(c => !selectedUser.assignedChannels.some(ch => ch.channelId === c.id))
                        .map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => assign(c.id)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-accent-wash text-primary"
                          >
                            <span className="text-lg font-light text-accent">#</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{c.name}</span>
                              <span className="block text-xs text-faint">{c.description}</span>
                            </span>
                            <span className="text-xs font-semibold text-accent">分配 →</span>
                          </button>
                        ))}
                      {courses.filter(c => !selectedUser.assignedChannels.some(ch => ch.channelId === c.id)).length === 0 && (
                        <p className="px-3 py-4 text-xs text-muted">所有课程已分配</p>
                      )}
                    </div>

                    {/* Organization assignment */}
                    <h3 className="mt-5 text-xs font-semibold text-muted">组织归属</h3>
                    <div className="mt-2 grid gap-2">
                      <label className="grid gap-1">
                        <span className="text-[10px] text-faint">学校 ID（如 school-1）</span>
                        <input
                          type="text"
                          value={orgSchoolId}
                          onChange={e => setOrgSchoolId(e.target.value)}
                          placeholder="school-1"
                          className="rounded-lg border border-divider bg-elevated px-3 py-2 text-xs text-primary outline-none focus:border-accent"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-[10px] text-faint">院系 ID（如 dept-cs）</span>
                        <input
                          type="text"
                          value={orgDeptId}
                          onChange={e => setOrgDeptId(e.target.value)}
                          placeholder="dept-cs"
                          className="rounded-lg border border-divider bg-elevated px-3 py-2 text-xs text-primary outline-none focus:border-accent"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-[10px] text-faint">班级 ID（如 class-cs-2401）</span>
                        <input
                          type="text"
                          value={orgClassId}
                          onChange={e => setOrgClassId(e.target.value)}
                          placeholder="class-cs-2401"
                          className="rounded-lg border border-divider bg-elevated px-3 py-2 text-xs text-primary outline-none focus:border-accent"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={saveOrg}
                        disabled={orgSaving}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                          orgSaved
                            ? 'bg-green-500 text-white'
                            : 'bg-accent text-on-accent hover:bg-accent-hover'
                        } disabled:opacity-40`}
                      >
                        {orgSaving ? '保存中...' : orgSaved ? '已保存 ✓' : '保存组织'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full min-h-40 items-center justify-center text-sm text-muted">
                    从左侧选择一个用户
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
