import { atom } from 'jotai';
import { getToken } from '../lib/authApi';

export const tokenAtom = atom<string | null>(getToken());

export const isAuthenticatedAtom = atom((get) => get(tokenAtom) !== null);
