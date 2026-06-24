import { atom } from 'jotai';
import type { OrganizationSummaryResponse } from '../lib/organizationApi';

export const organizationsAtom = atom<OrganizationSummaryResponse[]>([]);
export const organizationsLoadingAtom = atom(false);
export const organizationsErrorAtom = atom('');
