import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
import { fetchOrganizations, joinOrganization, type OrganizationDetailResponse } from '../lib/organizationApi';
import { organizationsAtom, organizationsErrorAtom, organizationsLoadingAtom } from '../state/organizationAtoms';

export function useOrganizations() {
  const [organizations, setOrganizations] = useAtom(organizationsAtom);
  const loading = useAtomValue(organizationsLoadingAtom);
  const error = useAtomValue(organizationsErrorAtom);
  const setLoading = useSetAtom(organizationsLoadingAtom);
  const setError = useSetAtom(organizationsErrorAtom);

  const publicOrganizations = useMemo(
    () => organizations.filter((organization) => organization.visibility === 'PUBLIC'),
    [organizations]
  );

  const joinedOrganizations = useMemo(
    () => organizations.filter((organization) => organization.joined),
    [organizations]
  );

  const refreshOrganizations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const nextOrganizations = await fetchOrganizations();
      setOrganizations(nextOrganizations);
      return nextOrganizations;
    } catch (error) {
      setOrganizations([]);
      setError('组织加载失败');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setOrganizations]);

  const applyJoinedOrganization = useCallback((detail: OrganizationDetailResponse) => {
    setOrganizations((current) => current.map((organization) => (
      organization.id === detail.id
        ? {
            ...organization,
            joined: detail.joined,
            memberCount: detail.memberCount,
            defaultChannelId: detail.defaultChannelId
          }
        : organization
    )));
  }, [setOrganizations]);

  const joinAndRefreshOrganization = useCallback(async (organizationId: string) => {
    const detail = await joinOrganization(organizationId);
    applyJoinedOrganization(detail);
    await refreshOrganizations().catch(() => undefined);
    return detail;
  }, [applyJoinedOrganization, refreshOrganizations]);

  const clearOrganizations = useCallback(() => {
    setOrganizations([]);
    setError('');
    setLoading(false);
  }, [setError, setLoading, setOrganizations]);

  return {
    organizations,
    publicOrganizations,
    joinedOrganizations,
    loading,
    error,
    refreshOrganizations,
    joinAndRefreshOrganization,
    applyJoinedOrganization,
    clearOrganizations
  };
}
