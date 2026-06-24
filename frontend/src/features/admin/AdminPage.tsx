import { useAtomValue } from 'jotai';
import { currentUserAtom } from '../../state/chatAtoms';

export function AdminPage() {
  const currentUser = useAtomValue(currentUserAtom);

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-content text-muted text-sm">
        仅管理员可访问此页面。
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-content px-6 py-6 text-primary max-md:px-4">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[2rem] border border-divider bg-elevated p-7 shadow-panel">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-strong">Admin</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-strong">组织治理后台</h1>
          <p className="mt-3 text-sm leading-7 text-muted">
            频道访问权已经统一由 OrganizationMember 决定。直接给用户分配频道的旧入口已收束，后续会在组织管理页中提供成员、角色和邀请码管理。
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-divider bg-card p-5">
              <h2 className="text-sm font-semibold text-strong">当前已统一</h2>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                <li>频道归属字段：organizationId</li>
                <li>频道类型：ORGANIZATION</li>
                <li>访问判断：OrganizationMember</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-divider bg-card p-5">
              <h2 className="text-sm font-semibold text-strong">后续管理面</h2>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted">
                <li>查看组织成员</li>
                <li>维护 Organizer / Member 角色</li>
                <li>生成或禁用组织邀请码</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
