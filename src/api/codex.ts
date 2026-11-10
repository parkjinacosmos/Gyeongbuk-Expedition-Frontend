import { clearSession } from './session';
import { exploreApi } from './explore';

// ========================================
// Types
// ========================================

export type CodexState =
  | 'UNDISCOVERED'
  | 'COLLECTING'
  | 'COMPLETED';

export type CodexRegionStatus =
  | 'CURRENT'
  | 'UNLOCKED'
  | 'LOCKED';

export interface CodexRegion {
  id: number;
  code: string;
  name: string;
  status: CodexRegionStatus;
}

export interface CodexItem {
  id: number;
  name: string;
  region: CodexRegion;
  state: CodexState;
  pieces: number;
  required_pieces: number;
  image_url: string | null;
}

export interface CodexSummary {
  total: number;
  discovered: number;
  completed: number;
}

export interface CodexListResponse {
  summary: CodexSummary;
  items: CodexItem[];
}

export interface CodexProduct {
  id: number;
  name: string;
  status: 'ACTIVE' | 'PREPARING';
  image_url: string | null;
}

export interface CodexDetail extends CodexItem {
  description: string | null;
  source: string | null;
  completed_at: string | null;
  unlocks_region: {
    id: number;
    code: string;
    name: string;
  } | null;
  products: CodexProduct[];
}

interface ErrorResponse {
  code?: string;
  message?: string;
}

// ========================================
// Environment
// ========================================

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:3000/api/v1'
).replace(/\/$/, '');

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK_API !== 'false';

// ========================================
// Real API Request
// ========================================

async function request<T>(path: string): Promise<T> {
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error: ErrorResponse | null =
      await response.json().catch(() => null);

    if (response.status === 401) {
      clearSession();
    }

    throw new Error(
      error?.message ?? '도감 정보를 불러오지 못했어요.',
    );
  }

  return response.json() as Promise<T>;
}

// ========================================
// Mock Data
// ========================================

const MOCK_SPECIALTIES = [
  { id: 1, regionId: 1, code: 'R01', regionName: '청송', name: '사과' },
  { id: 2, regionId: 2, code: 'R02', regionName: '안동', name: '간고등어' },
  { id: 3, regionId: 3, code: 'R03', regionName: '영주', name: '풍기인삼' },
  { id: 4, regionId: 4, code: 'R04', regionName: '문경', name: '오미자' },
  { id: 5, regionId: 5, code: 'R05', regionName: '상주', name: '곶감' },
  { id: 6, regionId: 6, code: 'R06', regionName: '성주', name: '참외' },
  { id: 7, regionId: 7, code: 'R07', regionName: '의성', name: '마늘' },
  { id: 8, regionId: 8, code: 'R08', regionName: '포항', name: '과메기' },
] as const;

// ========================================
// Mock API
// ========================================

async function getMockCodex(
  regionId?: number,
): Promise<CodexListResponse> {
  // 탐험 Mock에서 관리하는 조각 수를 가져옵니다.
  const { regions } = await exploreApi.getRegions();

  const items: CodexItem[] = MOCK_SPECIALTIES.map(
    (specialty) => {
      const exploreRegion = regions.find(
        (region) => region.id === specialty.regionId,
      );

      const pieces =
        exploreRegion?.specialty.pieces ?? 0;

      const requiredPieces =
        exploreRegion?.specialty.required_pieces ?? 20;

      const status: CodexRegionStatus =
        exploreRegion?.status ?? 'LOCKED';

      const state: CodexState =
        pieces >= requiredPieces
          ? 'COMPLETED'
          : pieces > 0
            ? 'COLLECTING'
            : 'UNDISCOVERED';

      return {
        id: specialty.id,
        name: specialty.name,
        region: {
          id: specialty.regionId,
          code: specialty.code,
          name: specialty.regionName,
          status,
        },
        state,
        pieces,
        required_pieces: requiredPieces,
        image_url: null,
      };
    },
  );

  const filteredItems =
    regionId === undefined
      ? items
      : items.filter(
          (item) => item.region.id === regionId,
        );

  return {
    summary: {
      total: items.length,
      discovered: items.filter(
        (item) => item.state !== 'UNDISCOVERED',
      ).length,
      completed: items.filter(
        (item) => item.state === 'COMPLETED',
      ).length,
    },
    items: filteredItems,
  };
}

async function getMockDetail(
  specialtyId: number,
): Promise<CodexDetail> {
  const { items } = await getMockCodex();

  const item = items.find(
    (specialty) => specialty.id === specialtyId,
  );

  if (!item) {
    throw new Error('존재하지 않는 특산물입니다.');
  }

  return {
    ...item,
    description: null,
    source: null,
    completed_at: null,
    unlocks_region: null,
    products: [],
  };
}

// ========================================
// Public API
// ========================================

export const codexApi = {
  getCodex(regionId?: number): Promise<CodexListResponse> {
    if (USE_MOCK) {
      return getMockCodex(regionId);
    }

    const query =
      regionId === undefined
        ? ''
        : `&region_id=${regionId}`;

    return request<CodexListResponse>(`/codex?include_inactive=true${query}`);
  },

  getDetail(specialtyId: number): Promise<CodexDetail> {
    if (USE_MOCK) {
      return getMockDetail(specialtyId);
    }

    return request<CodexDetail>(`/codex/${specialtyId}`);
  },
};
