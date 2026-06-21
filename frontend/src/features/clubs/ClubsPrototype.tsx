import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '../../components/Icon';

// PROTOTYPE: Three club-plaza variants on /clubs, switchable via ?variant=.
type VariantKey = 'A' | 'B' | 'C';
type ClubCategory = '科技' | '艺术' | '体育' | '公益' | '学术';

interface Club {
  id: number;
  name: string;
  shortName: string;
  category: ClubCategory;
  slogan: string;
  members: number;
  activity: string;
  location: string;
  joined?: boolean;
  colors: string;
}

const clubs: Club[] = [
  { id: 1, name: '机器人创新协会', shortName: 'R', category: '科技', slogan: '把想法装进机器，让它真正动起来。', members: 186, activity: '机器人开放工坊', location: '工程训练中心 A302', colors: 'from-[#0f766e] to-[#34d399]' },
  { id: 2, name: '银河摄影社', shortName: 'P', category: '艺术', slogan: '记录校园里被匆忙错过的光。', members: 243, activity: '夏至校园夜拍', location: '图书馆南广场', colors: 'from-[#4338ca] to-[#a78bfa]' },
  { id: 3, name: '飞盘运动社', shortName: 'U', category: '体育', slogan: '跑向空地，也跑向新的朋友。', members: 128, activity: '新手体验局', location: '东区体育场', joined: true, colors: 'from-[#c2410c] to-[#fb923c]' },
  { id: 4, name: '星火志愿服务队', shortName: 'V', category: '公益', slogan: '让每一次行动都留下真实改变。', members: 312, activity: '社区数字助老', location: '大学生活动中心', colors: 'from-[#be123c] to-[#fb7185]' },
  { id: 5, name: '青年经济学社', shortName: 'E', category: '学术', slogan: '从校园出发，理解真实世界如何运转。', members: 96, activity: '城市经济圆桌', location: '博学楼 B204', colors: 'from-[#0369a1] to-[#38bdf8]' },
  { id: 6, name: '现代舞团', shortName: 'D', category: '艺术', slogan: '身体会说出语言还没找到的句子。', members: 74, activity: '夏季公演排练', location: '艺术中心排练厅', colors: 'from-[#7e22ce] to-[#e879f9]' }
];

const events = [
  { day: '21', weekday: '今天', time: '18:30', title: '机器人开放工坊', club: '机器人创新协会', place: '工程训练中心 A302', tag: '可直接参加', color: 'bg-accent' },
  { day: '22', weekday: '周一', time: '19:00', title: '夏至校园夜拍', club: '银河摄影社', place: '图书馆南广场', tag: '剩余 12 席', color: 'bg-violet' },
  { day: '24', weekday: '周三', time: '17:20', title: '飞盘新手体验局', club: '飞盘运动社', place: '东区体育场', tag: '器材免费', color: 'bg-info' },
  { day: '27', weekday: '周六', time: '09:00', title: '社区数字助老', club: '星火志愿服务队', place: '大学生活动中心集合', tag: '需报名', color: 'bg-danger' }
];

const variants: Array<{ key: VariantKey; name: string }> = [
  { key: 'A', name: '灵感广场' },
  { key: 'B', name: '活动日历' },
  { key: 'C', name: '社团目录' }
];

function SmallIcon({ children }: { children: ReactNode }) {
  return <Icon className="size-4">{children}</Icon>;
}

function SearchBox({ placeholder = '搜索社团或活动' }: { placeholder?: string }) {
  return <label className="flex min-w-60 items-center gap-2 rounded-xl border border-divider bg-card px-3 py-2.5 text-faint"><SmallIcon><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></SmallIcon><input className="min-w-0 flex-1 bg-transparent text-xs text-primary outline-none placeholder:text-faint" placeholder={placeholder} /></label>;
}

function PageHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`flex flex-wrap items-center justify-between gap-4 border-b border-divider bg-content px-7 ${compact ? 'py-4' : 'py-6'} max-sm:px-4`}>
      <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-strong">Club plaza</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-strong">社团广场</h1>{!compact && <p className="mt-1 text-sm text-muted">从一次活动开始，找到愿意长期参与的校园共同体。</p>}</div>
      <SearchBox />
    </header>
  );
}

function ClubMark({ club, large = false }: { club: Club; large?: boolean }) {
  return <span className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${club.colors} font-bold text-white shadow-composer ${large ? 'size-16 text-xl' : 'size-11 text-sm'}`}>{club.shortName}</span>;
}

function VariantA() {
  const [category, setCategory] = useState<'全部' | ClubCategory>('全部');
  const visible = category === '全部' ? clubs : clubs.filter((club) => club.category === category);
  return (
    <div className="min-h-screen bg-content">
      <PageHeader />
      <main className="mx-auto max-w-7xl px-7 py-7 max-sm:px-4">
        <div className="flex gap-2 overflow-x-auto pb-2">{(['全部', '科技', '艺术', '体育', '公益', '学术'] as const).map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${category === item ? 'bg-accent text-on-accent' : 'border border-divider bg-card text-muted hover:bg-hover'}`}>{item}</button>)}</div>
        {category === '全部' && <section className="relative mt-5 overflow-hidden rounded-[32px] bg-[#102f29] px-8 py-9 text-white shadow-panel max-sm:px-6">
          <div className="relative z-10 max-w-xl"><p className="text-xs font-semibold text-emerald-200">本周主理人推荐</p><h2 className="mt-3 text-3xl font-semibold leading-tight">亲手组装你的第一台<br />循迹机器人</h2><p className="mt-4 max-w-md text-sm leading-6 text-emerald-50/70">不需要基础，协会提供零件、工具和队友。完成后可以直接参加校园竞速挑战。</p><div className="mt-6 flex flex-wrap gap-3"><button className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#102f29]">查看活动</button><button className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white">进入社团频道</button></div></div>
          <div className="absolute -right-12 -top-20 size-80 rounded-full border-[55px] border-emerald-300/10" /><div className="absolute bottom-8 right-16 grid size-32 rotate-12 place-items-center rounded-[34px] border border-white/15 bg-white/10 text-5xl font-black text-emerald-200 max-md:hidden">R</div>
        </section>}
        <div className="mt-7 flex items-end justify-between"><div><h2 className="text-lg font-semibold text-strong">{category === '全部' ? '值得认识的社团' : `${category}社团`}</h2><p className="mt-1 text-xs text-muted">根据近期活跃度与校园关注推荐</p></div><span className="text-xs text-faint">{visible.length} 个结果</span></div>
        <section className="mt-4 grid grid-cols-3 gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
          {visible.map((club, index) => <article key={club.id} className={`group overflow-hidden rounded-3xl border border-divider bg-card transition hover:-translate-y-1 hover:shadow-panel ${index === 0 && category === '全部' ? 'xl:col-span-2' : ''}`}>
            <div className={`relative h-28 bg-gradient-to-br ${club.colors}`}><div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_25%_25%,white_0,white_2px,transparent_2.5px)] [background-size:22px_22px]" /><span className="absolute bottom-4 left-5 rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">{club.category}</span></div>
            <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="text-base font-semibold text-strong">{club.name}</h3><p className="mt-2 text-xs leading-5 text-muted">{club.slogan}</p></div>{club.joined && <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-semibold text-accent-strong">已加入</span>}</div><div className="mt-5 flex items-center justify-between border-t border-divider pt-4"><span className="text-xs text-faint">{club.members} 位成员</span><button className="text-xs font-semibold text-accent">查看社团 →</button></div></div>
          </article>)}
        </section>
      </main>
    </div>
  );
}

function VariantB() {
  const [scope, setScope] = useState<'all' | 'joined'>('all');
  return (
    <div className="min-h-screen bg-content">
      <PageHeader compact />
      <main className="mx-auto grid max-w-6xl grid-cols-[220px_minmax(0,1fr)] gap-8 px-7 py-7 max-lg:grid-cols-1 max-sm:px-4">
        <aside>
          <div className="rounded-2xl border border-divider bg-card p-4"><p className="text-xs font-semibold text-strong">六月</p><div className="mt-4 grid grid-cols-7 gap-y-2 text-center text-[10px] text-faint">{['一','二','三','四','五','六','日'].map((day) => <span key={day}>{day}</span>)}{Array.from({ length: 30 }, (_, index) => <button key={index} className={`mx-auto grid size-7 place-items-center rounded-lg text-xs ${index + 1 === 21 ? 'bg-accent font-semibold text-on-accent' : [22,24,27].includes(index + 1) ? 'bg-accent-soft font-semibold text-accent-strong' : 'text-muted hover:bg-hover'}`}>{index + 1}</button>)}</div></div>
          <div className="mt-4 rounded-2xl border border-divider bg-sidebar p-4"><p className="text-xs font-semibold text-strong">活动图例</p><div className="mt-3 grid gap-2 text-xs text-muted">{[['bg-accent','科技实践'],['bg-violet','艺术文化'],['bg-info','运动户外'],['bg-danger','公益服务']].map(([color,label]) => <span key={label} className="flex items-center gap-2"><i className={`size-2 rounded-full ${color}`} />{label}</span>)}</div></div>
        </aside>
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold text-accent-strong">6 月 21 日至 27 日</p><h2 className="mt-1 text-xl font-semibold text-strong">这周去哪里</h2></div><div className="flex rounded-xl bg-active p-1"><button onClick={() => setScope('all')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${scope === 'all' ? 'bg-card text-strong shadow-sm' : 'text-muted'}`}>全校活动</button><button onClick={() => setScope('joined')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${scope === 'joined' ? 'bg-card text-strong shadow-sm' : 'text-muted'}`}>我的社团</button></div></div>
          <div className="relative mt-6"><div className="absolute bottom-0 left-[51px] top-0 w-px bg-divider" /><div className="grid gap-6">{events.filter((_, index) => scope === 'all' || index === 2).map((event) => <article key={event.title} className="relative grid grid-cols-[76px_minmax(0,1fr)] gap-5"><div className="relative z-10 text-center"><p className="text-[10px] font-semibold text-faint">{event.weekday}</p><p className="mt-1 text-xl font-semibold text-strong">{event.day}</p><span className={`mx-auto mt-2 block size-3 rounded-full border-[3px] border-content ${event.color}`} /></div><div className="rounded-2xl border border-divider bg-card p-5 transition hover:shadow-composer"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-accent-strong">{event.time} · {event.club}</span><span className="rounded-full bg-active px-2.5 py-1 text-[10px] text-muted">{event.tag}</span></div><h3 className="mt-2 text-base font-semibold text-strong">{event.title}</h3><div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-faint"><span className="flex items-center gap-1.5"><SmallIcon><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></SmallIcon>{event.place}</span><button className="font-semibold text-accent">查看并报名 →</button></div></div></article>)}</div></div>
        </section>
      </main>
    </div>
  );
}

function VariantC() {
  const [selectedId, setSelectedId] = useState(clubs[0].id);
  const [category, setCategory] = useState<'全部' | ClubCategory>('全部');
  const selected = clubs.find((club) => club.id === selectedId) || clubs[0];
  const visible = category === '全部' ? clubs : clubs.filter((club) => club.category === category);
  return (
    <div className="grid min-h-screen grid-rows-[auto_minmax(0,1fr)] bg-content">
      <PageHeader compact />
      <main className="grid min-h-0 grid-cols-[230px_360px_minmax(0,1fr)] max-xl:grid-cols-[320px_minmax(0,1fr)] max-md:grid-cols-1">
        <aside className="border-r border-divider bg-sidebar p-5 max-xl:hidden"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-faint">筛选社团</p><div className="mt-5"><p className="text-xs font-semibold text-strong">兴趣领域</p><div className="mt-3 grid gap-1">{(['全部','科技','艺术','体育','公益','学术'] as const).map((item) => <button key={item} onClick={() => setCategory(item)} className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${category === item ? 'bg-active font-semibold text-strong' : 'text-muted hover:bg-hover'}`}><span>{item}</span><span className="text-faint">{item === '全部' ? clubs.length : clubs.filter((club) => club.category === item).length}</span></button>)}</div></div><div className="mt-7 border-t border-divider pt-5"><p className="text-xs font-semibold text-strong">参与方式</p><label className="mt-3 flex items-center gap-2 text-xs text-muted"><input type="checkbox" className="accent-[var(--theme-accent)]" />正在招新</label><label className="mt-3 flex items-center gap-2 text-xs text-muted"><input type="checkbox" className="accent-[var(--theme-accent)]" />无需面试</label><label className="mt-3 flex items-center gap-2 text-xs text-muted"><input type="checkbox" className="accent-[var(--theme-accent)]" />本周有活动</label></div></aside>
        <section className="min-h-0 overflow-y-auto border-r border-divider bg-card"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-divider bg-card/95 px-5 py-3 backdrop-blur"><span className="text-xs font-semibold text-muted">{visible.length} 个社团</span><button className="text-xs text-faint">按活跃度排序</button></div>{visible.map((club) => <button key={club.id} onClick={() => setSelectedId(club.id)} className={`flex w-full gap-3 border-b border-divider p-5 text-left transition ${club.id === selectedId ? 'bg-accent-wash' : 'hover:bg-hover'}`}><ClubMark club={club} /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm text-strong">{club.name}</strong><span className="rounded-md bg-active px-2 py-1 text-[9px] text-faint">{club.category}</span></span><span className="mt-1.5 block truncate text-xs text-muted">{club.slogan}</span><span className="mt-2 block text-[10px] text-faint">{club.members} 人 · 本周活跃</span></span></button>)}</section>
        <section className="min-h-0 overflow-y-auto p-7 max-sm:p-4"><div className={`relative h-44 overflow-hidden rounded-3xl bg-gradient-to-br ${selected.colors}`}><div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,white_1px,transparent_1px)] [background-size:18px_18px]" /><div className="absolute bottom-5 left-6 flex items-end gap-4"><ClubMark club={selected} large /><div className="pb-1 text-white"><p className="text-xs font-semibold text-white/70">{selected.category} · {selected.members} 位成员</p><h2 className="mt-1 text-2xl font-semibold">{selected.name}</h2></div></div></div><p className="mt-6 text-base font-semibold leading-7 text-strong">{selected.slogan}</p><p className="mt-3 text-sm leading-7 text-muted">我们通过每周活动、项目协作和课程分享连接有共同兴趣的同学。新成员可以先参加开放活动，再决定是否正式加入。</p><div className="mt-6 grid grid-cols-2 gap-3 max-sm:grid-cols-1"><button className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent">{selected.joined ? '进入社团频道' : '申请加入'}</button><button className="rounded-xl border border-divider bg-card px-4 py-3 text-sm font-semibold text-primary">进入社团频道</button></div><div className="mt-7 rounded-2xl border border-divider bg-card p-5"><p className="text-xs font-semibold text-accent-strong">近期活动</p><h3 className="mt-2 text-base font-semibold text-strong">{selected.activity}</h3><p className="mt-2 text-xs text-muted">本周六 18:30 · {selected.location}</p><button className="mt-4 text-xs font-semibold text-accent">查看活动详情 →</button></div></section>
      </main>
    </div>
  );
}

function PrototypeSwitcher({ current, onChange }: { current: VariantKey; onChange: (key: VariantKey) => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { const target = event.target as HTMLElement; if (['INPUT','TEXTAREA'].includes(target.tagName) || target.isContentEditable) return; if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return; const index = variants.findIndex((variant) => variant.key === current); const offset = event.key === 'ArrowRight' ? 1 : -1; onChange(variants[(index + offset + variants.length) % variants.length].key); };
    window.addEventListener('keydown', onKeyDown); return () => window.removeEventListener('keydown', onKeyDown);
  }, [current, onChange]);
  if (import.meta.env.PROD) return null;
  const index = variants.findIndex((variant) => variant.key === current); const move = (offset: number) => onChange(variants[(index + offset + variants.length) % variants.length].key);
  return <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-[#13211e] p-1.5 text-white shadow-panel"><button type="button" onClick={() => move(-1)} className="grid size-8 place-items-center rounded-full hover:bg-white/10" aria-label="上一个方案">←</button><span className="min-w-32 text-center text-xs font-semibold">{current} · {variants[index].name}</span><button type="button" onClick={() => move(1)} className="grid size-8 place-items-center rounded-full hover:bg-white/10" aria-label="下一个方案">→</button></div>;
}

export function ClubsPrototype() {
  const initial = new URLSearchParams(window.location.search).get('variant');
  const [variant, setVariant] = useState<VariantKey>(initial === 'B' || initial === 'C' ? initial : 'A');
  const changeVariant = (next: VariantKey) => { setVariant(next); const url = new URL(window.location.href); url.searchParams.set('variant', next); window.history.replaceState({}, '', url); };
  return <>{variant === 'A' && <VariantA />}{variant === 'B' && <VariantB />}{variant === 'C' && <VariantC />}<PrototypeSwitcher current={variant} onChange={changeVariant} /></>;
}
