import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { createActivity, type ActivityCategory, type ActivityPayload, type ActivityTimeMode } from '../../lib/activityApi';
import { categoryOptions, fromLocalInputValue } from './activityView';

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
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-strong">Publish</p>
        <h1 className="mt-2 text-2xl font-bold text-strong">发起事情</h1>
        <p className="mt-2 text-sm text-muted">任何登录用户都可以以个人身份发起 Activity。发布后直接 PUBLISHED。</p>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-divider bg-card p-6 shadow-card">
        <label className="grid gap-1 text-sm font-medium text-primary">标题<input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={128} className="rounded-xl border border-divider bg-surface px-3 py-2 outline-none focus:border-accent-soft" /></label>
        <label className="grid gap-1 text-sm font-medium text-primary">说明<textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} className="rounded-xl border border-divider bg-surface px-3 py-2 outline-none focus:border-accent-soft" /></label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-primary">分类<select value={category} onChange={(e) => setCategory(e.target.value as ActivityCategory)} className="rounded-xl border border-divider bg-surface px-3 py-2 outline-none focus:border-accent-soft">{categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="grid gap-1 text-sm font-medium text-primary">标签<input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="最多 5 个，用逗号或空格分隔" className="rounded-xl border border-divider bg-surface px-3 py-2 outline-none focus:border-accent-soft" /></label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium text-primary">时间类型<select value={timeMode} onChange={(e) => setTimeMode(e.target.value as ActivityTimeMode)} className="rounded-xl border border-divider bg-surface px-3 py-2 outline-none focus:border-accent-soft"><option value="SCHEDULED">有明确时间</option><option value="ONGOING">持续招募</option></select></label>
          {timeMode === 'SCHEDULED' ? <>
            <label className="grid gap-1 text-sm font-medium text-primary">开始时间<input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="rounded-xl border border-divider bg-surface px-3 py-2 outline-none focus:border-accent-soft" /></label>
            <label className="grid gap-1 text-sm font-medium text-primary">结束时间<input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="rounded-xl border border-divider bg-surface px-3 py-2 outline-none focus:border-accent-soft" /></label>
          </> : <label className="grid gap-1 text-sm font-medium text-primary md:col-span-2">截止时间<input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required className="rounded-xl border border-divider bg-surface px-3 py-2 outline-none focus:border-accent-soft" /></label>}
        </div>
        <label className="grid gap-1 text-sm font-medium text-primary">地点 / 线上说明<input value={location} onChange={(e) => setLocation(e.target.value)} required className="rounded-xl border border-divider bg-surface px-3 py-2 outline-none focus:border-accent-soft" /></label>
        <label className="grid gap-1 text-sm font-medium text-primary">参与方式<textarea value={participationMethod} onChange={(e) => setParticipationMethod(e.target.value)} required rows={4} placeholder="微信、QQ、邮箱、外部表单、线下集合说明等" className="rounded-xl border border-divider bg-surface px-3 py-2 outline-none focus:border-accent-soft" /></label>
        {error && <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <button type="submit" disabled={submitting} className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-on-accent disabled:opacity-60">{submitting ? '发布中...' : '发布 Activity'}</button>
      </form>
    </div>
  );
}
