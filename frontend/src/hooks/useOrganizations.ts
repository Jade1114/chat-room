import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
import { fetchOrganizations, joinOrganization, type OrganizationDetailResponse, type OrganizationSummaryResponse } from '../lib/organizationApi';
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

  const applyOrganization = useCallback((detail: OrganizationDetailResponse | OrganizationSummaryResponse) => {
    setOrganizations((current) => {
      const summary: OrganizationSummaryResponse = {
        id: detail.id,
        name: detail.name,
        description: detail.description,
        visibility: detail.visibility,
        joinPolicy: detail.joinPolicy,
        memberCount: detail.memberCount,
        joined: detail.joined,
        defaultChannelId: detail.defaultChannelId
      };
      const exists = current.some((organization) => organization.id === detail.id);
      if (!exists) {
        return [summary, ...current];
      }
      return current.map((organization) => (
        organization.id === detail.id
          ? {
              ...organization,
              ...summary
            }
          : organization
      ));
    });
  }, [setOrganizations]);

  const joinAndRefreshOrganization = useCallback(async (organizationId: string) => {
    const detail = await joinOrganization(organizationId);
    applyOrganization(detail);
    await refreshOrganizations().catch(() => undefined);
    return detail;
  }, [applyOrganization, refreshOrganizations]);

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
    applyOrganization,
    clearOrganizations
  };
}
