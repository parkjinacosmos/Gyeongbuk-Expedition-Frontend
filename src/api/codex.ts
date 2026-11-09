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

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:3000/api/v1'
).replace(/\/$/, '');

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
      localStorage.removeItem('access_token');
    }

    throw new Error(
      error?.message ?? '도감 정보를 불러오지 못했어요.',
    );
  }

  return response.json() as Promise<T>;
}

export const codexApi = {
  getCodex(regionId?: number) {
    const query =
      regionId === undefined ? '' : `?region_id=${regionId}`;

    return request<CodexListResponse>(`/codex${query}`);
  },

  getDetail(specialtyId: number) {
    return request<CodexDetail>(`/codex/${specialtyId}`);
  },
};
