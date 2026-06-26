import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { createActivity, type ActivityCategory, type ActivityPayload, type ActivityTimeMode } from '../../lib/activityApi';
import { categoryOptions, fromLocalInputValue } from './activityView';

const inputClass = 'w-full rounded-2xl border border-divider bg-surface px-4 py-3 text-sm outline-none transition focus:border-accent-soft';
const labelClass = 'grid gap-2 text-sm font-bold text-primary';

export function ActivityFormPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('STUDY');
  const [tags, setTags] = useState('');
  const [timeMode, setTimeMode] = useState<ActivityTimeMode>('SCHEDULED');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [location, setLocation] = useState('');
  const [participationMethod, setParticipationMethod] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const payload: ActivityPayload = {
      title,
      description,
      category,
      tags,
      timeMode,
      startTime: fromLocalInputValue(startTime),
      endTime: fromLocalInputValue(endTime),
      expiresAt: fromLocalInputValue(expiresAt),
      location,
      participationMethod
    };
    try {
      const created = await createActivity(payload);
      navigate({ to: '/activities/$activityId', params: { activityId: created.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败');
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <div className="min-h-screen bg-content px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/activities" className="mb-4 inline-flex items-center gap-2 rounded-full border border-divider bg-card px-4 py-2 text-sm font-semibold text-muted transition hover:border-accent-soft hover:text-accent-strong sm:mb-6">
          ← 返回活动中心
        </Link>
      </div>
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-6">
        <section className="order-2 rounded-[1.5rem] border border-divider bg-elevated p-5 shadow-panel sm:rounded-[2rem] sm:p-7 lg:sticky lg:top-8 lg:order-1 lg:self-start">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-accent-strong">发布活动</p>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-strong sm:text-3xl">发起一件值得一起完成的事</h1>
          <p className="mt-3 text-sm leading-7 text-muted sm:mt-4">
            把活动内容、时间地点和参与方式写清楚，让感兴趣的人能快速判断是否适合自己。
          </p>
          <div className="mt-5 grid gap-3 text-sm sm:mt-6">
            <div className="rounded-2xl bg-active p-4">
              <div className="font-bold text-strong">好的活动</div>
              <p className="mt-1 text-xs leading-5 text-muted">说明适合谁、在哪里、什么时候、怎么参与，例如“周六下午一起做读书分享”。</p>
            </div>
            <div className="rounded-2xl bg-active p-4">
              <div className="font-bold text-strong">发布建议</div>
              <p className="mt-1 text-xs leading-5 text-muted">参与方式可以写微信、QQ、邮箱、外部表单或线下集合说明。</p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="order-1 grid gap-4 rounded-[1.5rem] border border-divider bg-card p-4 shadow-sm sm:gap-5 sm:rounded-[2rem] sm:p-6 lg:order-2">
          <label className={labelClass}>标题<input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={128} placeholder="例如：周末一起做读书分享" className={inputClass} /></label>
          <label className={labelClass}>说明<textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={6} placeholder="说明活动适合谁、具体做什么、需要准备什么。" className={inputClass} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>分类<select value={category} onChange={(e) => setCategory(e.target.value as ActivityCategory)} className={inputClass}>{categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className={labelClass}>标签<input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="最多 5 个，用逗号或空格分隔" className={inputClass} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className={labelClass}>时间类型<select value={timeMode} onChange={(e) => setTimeMode(e.target.value as ActivityTimeMode)} className={inputClass}><option value="SCHEDULED">有明确时间</option><option value="ONGOING">持续招募</option></select></label>
            {timeMode === 'SCHEDULED' ? <>
              <label className={labelClass}>开始时间<input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className={inputClass} /></label>
              <label className={labelClass}>结束时间<input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} /></label>
            </> : <label className={`${labelClass} sm:col-span-2`}>截止时间<input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required className={inputClass} /></label>}
          </div>
          <label className={labelClass}>地点 / 线上说明<input value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="例如：图书馆三楼 / 腾讯会议 / 操场" className={inputClass} /></label>
          <label className={labelClass}>参与方式<textarea value={participationMethod} onChange={(e) => setParticipationMethod(e.target.value)} required rows={5} placeholder="微信、QQ、邮箱、外部表单、线下集合说明等" className={inputClass} /></label>
          {error && <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
          <button type="submit" disabled={submitting} className="rounded-2xl bg-accent px-5 py-4 text-sm font-black text-on-accent shadow-accent transition hover:bg-accent-hover disabled:opacity-60">{submitting ? '发布中...' : '发布活动'}</button>
        </form>
      </div>
    </div>
  );
}
