
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:3000/api/v1';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';

export type RegionStatus = 'CURRENT' | 'UNLOCKED' | 'LOCKED';

export interface CurrentRegion {
  id: number;
  code: string;
  name: string;
}

export interface ExploreUser {
  id: number;
  name: string;
  level: number;
  exp: number;
  exp_to_next_level: number;
  gold: number;
  level_gold_bonus_percent: number;
  equipment: {
    stage: number;
    gold_bonus_percent: number;
    next_upgrade_cost: number | null;
    next_required_level: number | null;
  };
  total_gold_bonus_percent: number;
  cur_region: CurrentRegion;
  last_settled_at: string;
  claimable_at: string;
  state_version: number;
  server_time: string;
}

export interface ExploreRegion {
  id: number;
  code: string;
  name: string;
  sort_order: number;
  gold_per_minute: number;
  exp_per_minute: number;
  description: string | null;
  specialty: {
    id: number;
    name: string;
    pieces: number;
    required_pieces: number;
  };
  status: RegionStatus;
  unlocked_at: string | null;
  unlock: {
    region_id: number;
    region_name: string;
    specialty_name: string;
    required_pieces: number;
    current_pieces: number;
  } | null;
}

export interface MoveRegionResponse {
  gold: number;
  level: number;
  exp: number;
  exp_to_next_level: number;
  cur_region: CurrentRegion;
  previous_region: CurrentRegion;
  settled: {
    elapsed_seconds: number;
    capped: boolean;
    gold: number;
    exp: number;
    pieces: {
      region_id: number;
      specialty_id: number;
      name: string;
      judgments: number;
      gained: number;
      total: number;
      carry_seconds: number;
      consecutive_fails: number;
    };
    unlocked_regions: Array<{ id: number; name: string }>;
  };
  state_version: number;
  started_at: string;
}


export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details: unknown = null,
  ) {
    super(message);

    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}


async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new ApiError(401, 'UNAUTHORIZED', '로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    if (response.status === 401) {
      localStorage.removeItem('access_token');
    }

    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? '요청에 실패했습니다.',
      error?.details ?? null,
    );
  }

  return response.json() as Promise<T>;
}

// 개발용 Mock Data
// 실제 백엔드 MVP는 R01, R02만 활성화되어 있음.
let mockUser: ExploreUser = {
  id: 1,
  name: '원정대장',
  level: 3,
  exp: 150,
  exp_to_next_level: 150,
  gold: 640,
  level_gold_bonus_percent: 10,
  equipment: {
    stage: 1,
    gold_bonus_percent: 0,
    next_upgrade_cost: 100,
    next_required_level: 1,
  },
  total_gold_bonus_percent: 10,
  cur_region: { id: 1, code: 'R01', name: '청송' },
  last_settled_at: new Date().toISOString(),
  claimable_at: new Date(Date.now() + 60000).toISOString(),
  state_version: 1,
  server_time: new Date().toISOString(),
};

const mockRegions: ExploreRegion[] = [
  {
    id: 1,
    code: 'R01',
    name: '청송',
    sort_order: 1,
    gold_per_minute: 5,
    exp_per_minute: 1,
    description: null,
    specialty: {
      id: 1,
      name: '사과',
      pieces: 20,
      required_pieces: 20,
    },
    status: 'CURRENT',
    unlocked_at: new Date().toISOString(),
    unlock: null,
  },
  {
    id: 2,
    code: 'R02',
    name: '안동',
    sort_order: 2,
    gold_per_minute: 8,
    exp_per_minute: 2,
    description: null,
    specialty: {
      id: 2,
      name: '간고등어',
      pieces: 0,
      required_pieces: 20,
    },
    status: 'UNLOCKED',
    unlocked_at: new Date().toISOString(),
    unlock: {
      region_id: 1,
      region_name: '청송',
      specialty_name: '사과',
      required_pieces: 20,
      current_pieces: 20,
    },
  },
];

const mockApi = {
  async getUser(): Promise<ExploreUser> {
    return structuredClone(mockUser);
  },

  async getRegions(): Promise<{ regions: ExploreRegion[] }> {
    return {
      regions: mockRegions.map((region) => ({
        ...structuredClone(region),
        status:
          region.id === mockUser.cur_region.id
            ? 'CURRENT'
            : 'UNLOCKED',
      })),
    };
  },

  async moveRegion(
    targetRegionId: number,
  ): Promise<MoveRegionResponse> {
    const target = mockRegions.find(
      (region) => region.id === targetRegionId,
    );

    if (!target) {
      throw new ApiError(
        404,
        'REGION_NOT_FOUND',
        '존재하지 않거나 비활성화된 지역입니다.',
      );
    }

    if (target.id === mockUser.cur_region.id) {
      throw new ApiError(
        409,
        'ALREADY_IN_REGION',
        '이미 탐험 중인 지역입니다.',
      );
    }

    const previous = mockUser.cur_region;
    const startedAt = new Date().toISOString();

    mockUser = {
      ...mockUser,
      cur_region: {
        id: target.id,
        code: target.code,
        name: target.name,
      },
      state_version: mockUser.state_version + 1,
      last_settled_at: startedAt,
      claimable_at: new Date(
        Date.now() + 60000,
      ).toISOString(),
    };

    return {
      gold: mockUser.gold,
      level: mockUser.level,
      exp: mockUser.exp,
      exp_to_next_level: mockUser.exp_to_next_level,
      cur_region: mockUser.cur_region,
      previous_region: previous,
      settled: {
        elapsed_seconds: 0,
        capped: false,
        gold: 0,
        exp: 0,
        pieces: {
          region_id: previous.id,
          specialty_id: previous.id,
          name: previous.id === 1 ? '사과' : '간고등어',
          judgments: 0,
          gained: 0,
          total: previous.id === 1 ? 20 : 0,
          carry_seconds: 0,
          consecutive_fails: 0,
        },
        unlocked_regions: [],
      },
      state_version: mockUser.state_version,
      started_at: startedAt,
    };
  },
};

export const exploreApi = {
  getUser(): Promise<ExploreUser> {
    return USE_MOCK
      ? mockApi.getUser()
      : request<ExploreUser>('/user');
  },

  getRegions(): Promise<{ regions: ExploreRegion[] }> {
    return USE_MOCK
      ? mockApi.getRegions()
      : request<{ regions: ExploreRegion[] }>('/regions');
  },

  moveRegion(
    targetRegionId: number,
    idempotencyKey: string = crypto.randomUUID(),
  ): Promise<MoveRegionResponse> {
    return USE_MOCK
      ? mockApi.moveRegion(targetRegionId)
      : request<MoveRegionResponse>('/regions/move', {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            target_region_id: targetRegionId,
          }),
        });
  },
};
