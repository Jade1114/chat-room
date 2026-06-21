import { useAtomValue } from 'jotai';
import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '../../components/Icon';
import { currentUserAtom } from '../../state/chatAtoms';

// PROTOTYPE: Three teaching-communication variants on /teacher-communication, switchable via ?variant=.
type VariantKey = 'A' | 'B' | 'C';
type QuestionState = 'waiting' | 'active' | 'resolved';

interface Question {
  id: number;
  course: string;
  title: string;
  author: string;
  time: string;
  state: QuestionState;
  context: string;
  excerpt: string;
  replies: number;
}

const questions: Question[] = [
  { id: 1, course: 'Java 后端开发', title: '事务回滚的边界应该怎么判断？', author: '林晓', time: '10 分钟前', state: 'waiting', context: '实验 5 · 订单服务', excerpt: '在 Service 里捕获异常后重新抛出，事务仍然没有回滚，是注解位置不对吗？', replies: 0 },
  { id: 2, course: '分布式实时通信', title: '断线重连后如何避免重复消费', author: '周然', time: '38 分钟前', state: 'active', context: '作业 3 · WebSocket 会话', excerpt: '客户端重连会重新订阅，服务端此时应该依赖 messageId 还是 sessionId 去重？', replies: 3 },
  { id: 3, course: 'Java 后端开发', title: 'DTO 和领域对象的转换放在哪一层？', author: '陈墨', time: '昨天', state: 'resolved', context: '第 7 周 · 课程内容', excerpt: 'Controller 直接调用 Mapper 会不会让接口层知道太多领域细节？', replies: 5 },
  { id: 4, course: '分布式实时通信', title: 'RabbitMQ 消息确认时机', author: '何安', time: '昨天', state: 'waiting', context: '实验 4 · 消息可靠性', excerpt: '业务落库成功之后再 ack，是否还需要处理 ack 本身失败的情况？', replies: 1 }
];

const variants: Array<{ key: VariantKey; name: string }> = [
  { key: 'A', name: '问题处理箱' },
  { key: 'B', name: '课程答疑台' },
  { key: 'C', name: '上下文对话' }
];

function SmallIcon({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Icon className={`size-4 ${className}`}>{children}</Icon>;
}

function Avatar({ name, accent = false }: { name: string; accent?: boolean }) {
  return <span className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-bold ${accent ? 'bg-accent text-on-accent' : 'bg-info-soft text-info'}`}>{name.slice(0, 1)}</span>;
}

function StatePill({ state }: { state: QuestionState }) {
  const config = {
    waiting: ['待回复', 'bg-danger-soft text-danger'],
    active: ['讨论中', 'bg-info-soft text-info'],
    resolved: ['已解决', 'bg-accent-soft text-accent-strong']
  } as const;
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${config[state][1]}`}>{config[state][0]}</span>;
}

function PageHeader({ teacher }: { teacher: boolean }) {
  return (
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-divider bg-content px-6 py-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-strong">Teacher communication</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-strong">{teacher ? '答疑与反馈' : '师生交流'}</h1>
      </div>
      <button type="button" className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent shadow-accent hover:bg-accent-hover">
        <SmallIcon><path d="M12 5v14M5 12h14" /></SmallIcon>{teacher ? '发布集中说明' : '提出新问题'}
      </button>
    </header>
  );
}

function QuestionListItem({ item, selected, onClick }: { item: Question; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`w-full border-b border-divider px-4 py-4 text-left transition ${selected ? 'bg-accent-wash' : 'hover:bg-hover'}`}>
      <span className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-accent-strong">{item.course}</span><span className="shrink-0 text-[10px] text-faint">{item.time}</span></span>
      <span className="mt-2 block text-sm font-semibold leading-5 text-strong">{item.title}</span>
      <span className="mt-2 block truncate text-xs text-muted">{item.excerpt}</span>
      <span className="mt-3 flex items-center justify-between"><StatePill state={item.state} /><span className="text-[10px] text-faint">{item.author} · {item.replies} 条回复</span></span>
    </button>
  );
}

function AnswerThread({ question, teacher }: { question: Question; teacher: boolean }) {
  return (
    <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] bg-content">
      <header className="border-b border-divider px-6 py-5">
        <div className="flex flex-wrap items-center gap-2"><StatePill state={question.state} /><span className="text-xs text-faint">{question.course} · {question.context}</span></div>
        <h2 className="mt-3 text-lg font-semibold text-strong">{question.title}</h2>
      </header>
      <div className="min-h-0 overflow-y-auto px-6 py-6">
        <div className="mx-auto grid max-w-3xl gap-5">
          <article className="flex gap-3"><Avatar name={question.author} /><div><p className="text-xs font-semibold text-primary">{question.author} <span className="ml-2 font-normal text-faint">{question.time}</span></p><p className="mt-2 rounded-2xl rounded-tl-sm bg-card p-4 text-sm leading-7 text-primary shadow-sm">{question.excerpt}<br />我尝试加了 <code className="rounded bg-active px-1.5 py-0.5 text-xs">rollbackFor</code>，结果还是一样。</p></div></article>
          <div className="my-1 flex items-center gap-3 text-[10px] text-faint"><span className="h-px flex-1 bg-divider" /><span>教师回复</span><span className="h-px flex-1 bg-divider" /></div>
          <article className="flex gap-3"><Avatar name="陈老师" accent /><div><p className="text-xs font-semibold text-accent-strong">陈老师 <span className="ml-2 font-normal text-faint">刚刚</span></p><div className="mt-2 rounded-2xl rounded-tl-sm border border-accent-soft bg-accent-wash p-4 text-sm leading-7 text-primary"><p>关键不是异常类型，而是代理调用的边界。先检查这个方法是不是由同一个类里的另一个方法直接调用。</p><div className="mt-3 rounded-xl border border-divider bg-card p-3 text-xs text-muted"><p className="font-semibold text-strong">关联课程资料</p><p className="mt-1">第 6 周：Spring 事务代理与传播行为</p></div></div></div></article>
        </div>
      </div>
      <footer className="border-t border-divider bg-elevated p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-divider bg-card p-2 shadow-composer">
          <textarea rows={2} placeholder={teacher ? '回复并引用课程资料…' : '补充代码、截图或追问…'} className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-primary outline-none placeholder:text-faint" />
          <button type="button" className="grid size-10 place-items-center rounded-xl bg-accent text-on-accent"><SmallIcon><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></SmallIcon></button>
        </div>
      </footer>
    </section>
  );
}

function VariantA({ teacher }: { teacher: boolean }) {
  const [filter, setFilter] = useState<'all' | QuestionState>('all');
  const visible = filter === 'all' ? questions : questions.filter((question) => question.state === filter);
  const [selectedId, setSelectedId] = useState(questions[0].id);
  const selected = questions.find((question) => question.id === selectedId) || questions[0];
  return (
    <div className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)] bg-content">
      <PageHeader teacher={teacher} />
      <div className="grid min-h-0 grid-cols-[220px_340px_minmax(0,1fr)] max-xl:grid-cols-[300px_minmax(0,1fr)] max-md:grid-cols-1">
        <aside className="border-r border-divider bg-sidebar p-4 max-xl:hidden">
          <p className="px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">处理视图</p>
          <div className="mt-3 grid gap-1">
            {([['all', '全部问题', questions.length], ['waiting', teacher ? '等待我回复' : '等待教师回复', 2], ['active', '讨论中', 1], ['resolved', '已解决', 1]] as const).map(([key, label, count]) => (
              <button key={key} type="button" onClick={() => setFilter(key)} className={`flex items-center rounded-xl px-3 py-2.5 text-sm ${filter === key ? 'bg-active font-semibold text-strong' : 'text-muted hover:bg-hover'}`}><span className="flex-1 text-left">{label}</span><span className="rounded-full bg-card px-2 py-0.5 text-[10px] text-faint">{count}</span></button>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-divider bg-card p-4"><p className="text-xs font-semibold text-strong">{teacher ? '今日响应情况' : '提问小提示'}</p><p className="mt-2 text-xs leading-5 text-muted">{teacher ? '平均首次回复 42 分钟，已有 6 个问题解决。' : '绑定课程与作业，教师更容易快速定位问题。'}</p></div>
        </aside>
        <aside className="min-h-0 overflow-y-auto border-r border-divider bg-card max-md:hidden">
          <div className="sticky top-0 z-10 border-b border-divider bg-card/95 px-4 py-3 backdrop-blur"><p className="text-xs font-semibold text-muted">{visible.length} 个问题</p></div>
          {visible.map((item) => <QuestionListItem key={item.id} item={item} selected={item.id === selectedId} onClick={() => setSelectedId(item.id)} />)}
        </aside>
        <AnswerThread question={selected} teacher={teacher} />
      </div>
    </div>
  );
}

function VariantB({ teacher }: { teacher: boolean }) {
  return (
    <div className="min-h-screen bg-content">
      <PageHeader teacher={teacher} />
      <div className="mx-auto max-w-6xl px-7 py-7 max-sm:px-4">
        <section className="rounded-3xl bg-[#14342c] p-7 text-white shadow-panel">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold text-emerald-200">Java 后端开发 · 课程答疑台</p><h2 className="mt-2 text-2xl font-semibold">一个问题，一次讲清，全班复用</h2><p className="mt-2 text-sm text-emerald-50/70">提问默认对课程成员可见，涉及个人成绩时可切换为私密。</p></div><button className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#14342c]">{teacher ? '写课程说明' : '发起提问'}</button></div>
          <div className="mt-7 grid grid-cols-3 gap-3 max-sm:grid-cols-1">{[['待解答', '2'], ['本周已解决', '14'], ['知识沉淀', '36']].map(([label, value]) => <div key={label} className="rounded-2xl bg-white/8 px-4 py-3"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-emerald-50/60">{label}</p></div>)}</div>
        </section>
        <div className="mt-7 grid grid-cols-[minmax(0,1fr)_280px] gap-7 max-lg:grid-cols-1">
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><button className="rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-strong">最新问题</button><button className="rounded-full px-3 py-1.5 text-xs text-muted hover:bg-hover">最多讨论</button><button className="rounded-full px-3 py-1.5 text-xs text-muted hover:bg-hover">已解决</button></div><div className="relative"><input placeholder="搜索课程问题" className="w-48 rounded-xl border border-divider bg-card px-3 py-2 text-xs outline-none placeholder:text-faint" /></div></div>
            <div className="mt-4 grid gap-3">
              {questions.map((question) => <article key={question.id} className="rounded-2xl border border-divider bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-composer"><div className="flex gap-3"><Avatar name={question.author} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-strong">{question.title}</p><StatePill state={question.state} /></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{question.excerpt}</p><div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-faint"><span>{question.author}</span><span>{question.time}</span><span className="rounded-md bg-active px-2 py-1">{question.context}</span><span className="ml-auto">{question.replies} 条回复</span></div></div></div></article>)}
            </div>
          </section>
          <aside className="grid content-start gap-4"><div className="rounded-2xl border border-divider bg-card p-5"><p className="text-xs font-semibold text-strong">本周高频主题</p><div className="mt-4 flex flex-wrap gap-2">{['Spring 事务', '消息幂等', '分层设计', '异常处理', 'RabbitMQ'].map((tag) => <span key={tag} className="rounded-lg bg-active px-2.5 py-1.5 text-xs text-muted">{tag}</span>)}</div></div><div className="rounded-2xl border border-accent-soft bg-accent-wash p-5"><p className="text-xs font-semibold text-accent-strong">提问规范</p><ol className="mt-3 grid gap-2 text-xs leading-5 text-muted"><li>1. 说明预期与实际结果</li><li>2. 附上最小必要代码</li><li>3. 选择对应课程内容</li></ol></div></aside>
        </div>
      </div>
    </div>
  );
}

function VariantC({ teacher }: { teacher: boolean }) {
  return (
    <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)_280px] bg-content max-xl:grid-cols-[240px_minmax(0,1fr)] max-md:grid-cols-1">
      <aside className="flex min-h-screen flex-col border-r border-divider bg-sidebar max-md:hidden">
        <div className="border-b border-divider p-4"><h1 className="text-sm font-semibold text-strong">{teacher ? '学生会话' : '教师会话'}</h1><div className="mt-3 flex items-center gap-2 rounded-xl border border-divider bg-card px-3 py-2"><SmallIcon className="text-faint"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></SmallIcon><input className="min-w-0 flex-1 bg-transparent text-xs outline-none" placeholder="搜索问题或课程" /></div></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">{questions.map((question, index) => <button key={question.id} className={`flex w-full gap-3 rounded-xl p-3 text-left ${index === 0 ? 'bg-active' : 'hover:bg-hover'}`}><Avatar name={teacher ? question.author : '陈老师'} accent={index === 0} /><span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><span className="text-xs font-semibold text-strong">{teacher ? question.author : '陈老师'}</span><span className="text-[9px] text-faint">{question.time}</span></span><span className="mt-1 block truncate text-xs text-muted">{question.title}</span><span className="mt-1 block text-[10px] text-accent-strong">{question.course}</span></span></button>)}</div>
      </aside>
      <AnswerThread question={questions[0]} teacher={teacher} />
      <aside className="border-l border-divider bg-sidebar p-5 max-xl:hidden">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint">当前上下文</p>
        <div className="mt-4 rounded-2xl border border-divider bg-card p-4"><p className="text-xs font-semibold text-accent-strong">Java 后端开发</p><p className="mt-2 text-sm font-semibold leading-5 text-strong">实验 5 · 订单服务</p><p className="mt-2 text-xs leading-5 text-muted">实现订单创建、库存扣减与失败回滚。</p><button className="mt-4 text-xs font-semibold text-accent">打开作业详情 →</button></div>
        <div className="mt-4 rounded-2xl border border-divider bg-card p-4"><p className="text-xs font-semibold text-strong">会话状态</p><div className="mt-3 flex items-center justify-between"><span className="text-xs text-muted">当前状态</span><StatePill state="waiting" /></div><div className="mt-3 flex items-center justify-between"><span className="text-xs text-muted">可见范围</span><span className="text-xs font-semibold text-primary">仅师生可见</span></div></div>
        <button className="mt-4 w-full rounded-xl border border-divider bg-card px-3 py-2.5 text-xs font-semibold text-primary hover:bg-hover">转为课程公开问答</button>
      </aside>
    </div>
  );
}

function PrototypeSwitcher({ current, onChange }: { current: VariantKey; onChange: (key: VariantKey) => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return;
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const index = variants.findIndex((variant) => variant.key === current);
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      onChange(variants[(index + offset + variants.length) % variants.length].key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, onChange]);
  if (import.meta.env.PROD) return null;
  const index = variants.findIndex((variant) => variant.key === current);
  const move = (offset: number) => onChange(variants[(index + offset + variants.length) % variants.length].key);
  return <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-[#13211e] p-1.5 text-white shadow-panel"><button type="button" onClick={() => move(-1)} className="grid size-8 place-items-center rounded-full hover:bg-white/10" aria-label="上一个方案">←</button><span className="min-w-32 text-center text-xs font-semibold">{current} · {variants[index].name}</span><button type="button" onClick={() => move(1)} className="grid size-8 place-items-center rounded-full hover:bg-white/10" aria-label="下一个方案">→</button></div>;
}

export function TeacherCommunicationPrototype() {
  const currentUser = useAtomValue(currentUserAtom);
  const initial = new URLSearchParams(window.location.search).get('variant');
  const [variant, setVariant] = useState<VariantKey>(initial === 'B' || initial === 'C' ? initial : 'A');
  const teacher = currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN';
  const changeVariant = (next: VariantKey) => { setVariant(next); const url = new URL(window.location.href); url.searchParams.set('variant', next); window.history.replaceState({}, '', url); };
  return <>{variant === 'A' && <VariantA teacher={teacher} />}{variant === 'B' && <VariantB teacher={teacher} />}{variant === 'C' && <VariantC teacher={teacher} />}<PrototypeSwitcher current={variant} onChange={changeVariant} /></>;
}
