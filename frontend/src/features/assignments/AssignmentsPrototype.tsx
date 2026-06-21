import { useAtomValue } from 'jotai';
import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '../../components/Icon';
import { currentUserAtom } from '../../state/chatAtoms';

// PROTOTYPE: Three assignment workspace variants on /assignments, switchable via ?variant=.
type VariantKey = 'A' | 'B' | 'C';
type AssignmentStatus = 'urgent' | 'active' | 'done';

interface Assignment {
  id: number;
  course: string;
  title: string;
  due: string;
  date: string;
  status: AssignmentStatus;
  submitted: number;
  total: number;
  score?: number;
  color: string;
}

const assignments: Assignment[] = [
  { id: 1, course: '数据结构', title: '实验 4：图的遍历与最短路径', due: '今天 23:59', date: '06.21', status: 'urgent', submitted: 38, total: 42, color: 'bg-danger' },
  { id: 2, course: '软件工程', title: '需求分析与用例建模', due: '周三 18:00', date: '06.24', status: 'active', submitted: 26, total: 39, color: 'bg-info' },
  { id: 3, course: '计算机网络', title: 'Wireshark HTTP 报文分析', due: '6 月 28 日', date: '06.28', status: 'active', submitted: 45, total: 51, color: 'bg-violet' },
  { id: 4, course: '数据库原理', title: '关系代数与 SQL 综合练习', due: '已截止', date: '06.18', status: 'done', submitted: 47, total: 48, score: 92, color: 'bg-accent' }
];

const variants: Array<{ key: VariantKey; name: string }> = [
  { key: 'A', name: '任务收件箱' },
  { key: 'B', name: '课程工作台' },
  { key: 'C', name: '截止时间线' }
];

function SmallIcon({ children }: { children: ReactNode }) {
  return <Icon className="size-4">{children}</Icon>;
}

function PageHeader({ teacher }: { teacher: boolean }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-divider px-7 py-6 max-sm:px-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-strong">Assignments</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-strong">{teacher ? '作业管理' : '我的作业'}</h1>
        <p className="mt-1 text-sm text-muted">{teacher ? '发布任务，跟进提交，把反馈送回课程。' : '先处理临近截止的任务，再安排本周进度。'}</p>
      </div>
      {teacher && (
        <button type="button" className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-accent transition hover:bg-accent-hover">
          <SmallIcon><path d="M12 5v14M5 12h14" /></SmallIcon> 发布作业
        </button>
      )}
    </header>
  );
}

function StatusPill({ status, teacher }: { status: AssignmentStatus; teacher: boolean }) {
  const labels = teacher
    ? { urgent: '即将截止', active: '收集中', done: '待归档' }
    : { urgent: '今天截止', active: '进行中', done: '已批改' };
  const style = status === 'urgent' ? 'bg-danger-soft text-danger' : status === 'done' ? 'bg-accent-soft text-accent-strong' : 'bg-info-soft text-info';
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}>{labels[status]}</span>;
}

function AssignmentRow({ item, teacher }: { item: Assignment; teacher: boolean }) {
  return (
    <button type="button" className="group grid w-full grid-cols-[5px_minmax(0,1fr)_auto] items-stretch overflow-hidden rounded-2xl border border-divider bg-card text-left transition hover:-translate-y-0.5 hover:shadow-composer">
      <span className={item.color} />
      <span className="min-w-0 px-4 py-4">
        <span className="flex items-center gap-2 text-xs font-medium text-muted"><span>{item.course}</span><span className="text-faint">·</span><span>{item.due}</span></span>
        <span className="mt-1.5 block truncate text-sm font-semibold text-strong">{item.title}</span>
        <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-active">
          <span className={`block h-full rounded-full ${item.color}`} style={{ width: teacher ? `${Math.round(item.submitted / item.total * 100)}%` : item.status === 'done' ? '100%' : item.status === 'urgent' ? '82%' : '45%' }} />
        </span>
      </span>
      <span className="flex min-w-28 flex-col items-end justify-center gap-2 border-l border-divider px-4">
        <StatusPill status={item.status} teacher={teacher} />
        <span className="text-xs text-faint">{teacher ? `${item.submitted}/${item.total} 已交` : item.score ? `${item.score} 分` : '查看任务'}</span>
      </span>
    </button>
  );
}

function VariantA({ teacher }: { teacher: boolean }) {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'done'>('all');
  const visible = filter === 'all' ? assignments : assignments.filter((item) => item.status === filter);
  return (
    <div className="min-h-screen bg-content">
      <PageHeader teacher={teacher} />
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_280px] gap-7 px-7 py-7 max-lg:grid-cols-1 max-sm:px-4">
        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex rounded-xl bg-active p-1">
              {([['all', teacher ? '全部' : '待完成'], ['urgent', '紧急'], ['done', teacher ? '已截止' : '已完成']] as const).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filter === key ? 'bg-card text-strong shadow-sm' : 'text-muted hover:text-primary'}`}>{label}</button>
              ))}
            </div>
            <span className="text-xs text-faint">{visible.length} 项任务</span>
          </div>
          <div className="grid gap-3">{visible.map((item) => <AssignmentRow key={item.id} item={item} teacher={teacher} />)}</div>
        </section>
        <aside className="grid content-start gap-4">
          <div className="rounded-2xl border border-divider bg-card p-5">
            <p className="text-xs font-semibold text-muted">{teacher ? '本周提交概览' : '本周进度'}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-strong">{teacher ? '81%' : '2 / 4'}</p>
            <p className="mt-1 text-xs text-faint">{teacher ? '156 份已提交，34 份待交' : '已完成任务'}</p>
            <div className="mt-5 grid grid-cols-7 items-end gap-1.5">
              {[35, 48, 28, 66, 80, 56, 92].map((height, index) => <span key={index} className={`rounded-t-md ${index === 6 ? 'bg-accent' : 'bg-accent-soft'}`} style={{ height }} />)}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-faint"><span>周一</span><span>今天</span></div>
          </div>
          <div className="rounded-2xl border border-divider bg-accent-wash p-5">
            <p className="text-xs font-semibold text-accent-strong">下一步</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-strong">{teacher ? '数据结构还有 4 人未提交' : '完成图的遍历实验报告'}</p>
            <button type="button" className="mt-4 text-xs font-semibold text-accent hover:text-accent-hover">{teacher ? '提醒未交学生 →' : '继续提交 →'}</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function VariantB({ teacher }: { teacher: boolean }) {
  const courses = [
    { name: '数据结构', code: 'CS204', tasks: 3, progress: 90, tone: 'bg-accent' },
    { name: '软件工程', code: 'SE301', tasks: 2, progress: 67, tone: 'bg-info' },
    { name: '计算机网络', code: 'CS305', tasks: 1, progress: 42, tone: 'bg-violet' }
  ];
  return (
    <div className="min-h-screen bg-content">
      <PageHeader teacher={teacher} />
      <div className="mx-auto max-w-6xl px-7 py-7 max-sm:px-4">
        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
          {courses.map((course, index) => (
            <button key={course.code} type="button" className={`relative overflow-hidden rounded-3xl border p-6 text-left transition hover:-translate-y-1 hover:shadow-panel ${index === 0 ? 'border-accent bg-accent-wash' : 'border-divider bg-card'}`}>
              <span className={`absolute left-0 top-0 h-full w-1.5 ${course.tone}`} />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint">{course.code}</span>
              <span className="mt-2 block text-xl font-semibold text-strong">{course.name}</span>
              <span className="mt-6 flex items-end justify-between"><span className="text-xs text-muted">{course.tasks} 项进行中</span><span className="text-2xl font-semibold text-strong">{course.progress}%</span></span>
              <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-active"><span className={`block h-full rounded-full ${course.tone}`} style={{ width: `${course.progress}%` }} /></span>
            </button>
          ))}
        </div>
        <section className="mt-7 overflow-hidden rounded-3xl border border-divider bg-card">
          <div className="flex items-center justify-between border-b border-divider px-6 py-5">
            <div><p className="text-sm font-semibold text-strong">数据结构 · 当前任务</p><p className="mt-1 text-xs text-faint">集中处理一门课，减少跨课程切换</p></div>
            <button type="button" className="rounded-xl border border-divider px-3 py-2 text-xs font-semibold text-primary hover:bg-hover">课程资料</button>
          </div>
          <div className="divide-y divide-divider">
            {assignments.slice(0, 3).map((item) => (
              <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_140px_120px] items-center gap-4 px-6 py-5 max-sm:grid-cols-1">
                <div><p className="text-sm font-semibold text-strong">{item.title}</p><p className="mt-1 text-xs text-muted">截止 {item.due}</p></div>
                <div><p className="text-xs text-faint">{teacher ? '提交进度' : '我的进度'}</p><p className="mt-1 text-sm font-semibold text-strong">{teacher ? `${item.submitted} / ${item.total}` : item.status === 'done' ? '已完成' : '编辑中'}</p></div>
                <button type="button" className="rounded-xl bg-accent-soft px-3 py-2 text-xs font-semibold text-accent-strong">{teacher ? '查看提交' : item.status === 'done' ? '查看反馈' : '打开作业'}</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function VariantC({ teacher }: { teacher: boolean }) {
  return (
    <div className="min-h-screen bg-content">
      <PageHeader teacher={teacher} />
      <div className="mx-auto max-w-4xl px-7 py-8 max-sm:px-4">
        <div className="mb-7 flex items-center justify-between"><div><p className="text-xs font-semibold text-muted">2026 年 6 月</p><h2 className="mt-1 text-lg font-semibold text-strong">本周截止节奏</h2></div><div className="flex gap-2"><button className="grid size-9 place-items-center rounded-xl border border-divider bg-card text-muted">‹</button><button className="grid size-9 place-items-center rounded-xl border border-divider bg-card text-muted">›</button></div></div>
        <div className="relative">
          <div className="absolute bottom-0 left-[51px] top-0 w-px bg-divider" />
          <div className="grid gap-7">
            {assignments.map((item, index) => (
              <article key={item.id} className="relative grid grid-cols-[76px_minmax(0,1fr)] gap-5">
                <div className="relative z-10 text-center"><p className="text-[10px] font-semibold uppercase text-faint">{index === 0 ? '今天' : index === 1 ? '周三' : index === 2 ? '周日' : '已过'}</p><p className="mt-1 text-lg font-semibold text-strong">{item.date.slice(3)}</p><span className={`mx-auto mt-2 block size-3 rounded-full border-[3px] border-content ${item.color}`} /></div>
                <button type="button" className={`rounded-2xl border p-5 text-left transition hover:shadow-composer ${item.status === 'urgent' ? 'border-danger-border bg-danger-soft' : 'border-divider bg-card'}`}>
                  <span className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-muted">{item.course}</span><StatusPill status={item.status} teacher={teacher} /></span>
                  <span className="mt-2 block text-base font-semibold text-strong">{item.title}</span>
                  <span className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-faint"><span>{teacher ? `${item.submitted} 人已交 · ${item.total - item.submitted} 人待交` : item.status === 'done' ? `教师评分 ${item.score}` : '支持文档、图片与压缩包'}</span><span className="font-semibold text-accent">{teacher ? '管理任务 →' : item.status === 'done' ? '查看反馈 →' : '进入提交 →'}</span></span>
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PrototypeSwitcher({ current, onChange }: { current: VariantKey; onChange: (key: VariantKey) => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const currentIndex = variants.findIndex((variant) => variant.key === current);
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      onChange(variants[(currentIndex + offset + variants.length) % variants.length].key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, onChange]);

  if (import.meta.env.PROD) return null;
  const index = variants.findIndex((variant) => variant.key === current);
  const move = (offset: number) => onChange(variants[(index + offset + variants.length) % variants.length].key);
  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-[#13211e] p-1.5 text-white shadow-panel">
      <button type="button" onClick={() => move(-1)} className="grid size-8 place-items-center rounded-full hover:bg-white/10" aria-label="上一个方案">←</button>
      <span className="min-w-32 text-center text-xs font-semibold">{current} · {variants[index].name}</span>
      <button type="button" onClick={() => move(1)} className="grid size-8 place-items-center rounded-full hover:bg-white/10" aria-label="下一个方案">→</button>
    </div>
  );
}

export function AssignmentsPrototype() {
  const currentUser = useAtomValue(currentUserAtom);
  const initial = new URLSearchParams(window.location.search).get('variant');
  const [variant, setVariant] = useState<VariantKey>(initial === 'B' || initial === 'C' ? initial : 'A');
  const teacher = currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN';

  const changeVariant = (next: VariantKey) => {
    setVariant(next);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', next);
    window.history.replaceState({}, '', url);
  };

  return (
    <>
      {variant === 'A' && <VariantA teacher={teacher} />}
      {variant === 'B' && <VariantB teacher={teacher} />}
      {variant === 'C' && <VariantC teacher={teacher} />}
      <PrototypeSwitcher current={variant} onChange={changeVariant} />
    </>
  );
}
