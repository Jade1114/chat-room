import { Link } from '@tanstack/react-router';

export function LegacyOrganizationBanner() {
  return (
    <div className="rounded-2xl border border-accent-soft bg-accent-wash px-4 py-3 text-sm text-muted">
      <p className="font-semibold text-strong">Legacy capability：组织 / 频道 / 聊天不属于当前 Activity-first MVP 验收主线。</p>
      <p className="mt-1 text-xs leading-5">
        当前 MVP 只验收发现 Activity、查看参与方式、私下联系和我的发布。若要回到主链路，请前往{' '}
        <Link to="/activities" className="font-semibold text-accent-strong hover:underline">发现事情</Link>。
      </p>
    </div>
  );
}
