const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:3000/api/v1';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';

const IDLE_CAP_SECONDS = 8 * 60 * 60;
const MIN_CLAIM_SECONDS = 60;
const SECONDS_PER_MOB = 4;
const GUARANTEED_AFTER_FAILS = 300;

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
  piece_drop_bp: number;
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

export interface RewardPieces {
  region_id: number;
  specialty_id: number;
  name: string;
  judgments: number;
  drop_rate_bp: number;
  gained: number;
  total: number;
  carry_seconds: number;
  consecutive_fails: number;
}

export interface SettledReward {
  elapsed_seconds: number;
  capped: boolean;
  gold: number;
  exp: number;
  mobs_defeated: number;
  pieces: RewardPieces;
  unlocked_regions: Array<{
    id: number;
    name: string;
  }>;
}

export interface MoveRegionResponse {
  gold: number;
  level: number;
  exp: number;
  exp_to_next_level: number;
  cur_region: CurrentRegion;
  previous_region: CurrentRegion;
  settled: SettledReward;
  state_version: number;
  started_at: string;
}

export interface IdleRewardPreview {
  elapsed_seconds: number;
  cap_seconds: number;
  capped: boolean;
  claimable: boolean;
  seconds_until_claimable: number;
  gold: number;
  exp: number;
  level_after: number;
  piece_judgments: number;
  mobs_defeated: number;
  server_time: string;
}

export interface IdleRewardClaim {
  gold: number;
  level: number;
  exp: number;
  exp_to_next_level: number;
  gained: SettledReward;
  leveled_up: boolean;
  previous_level: number;
  state_version: number;
  settled_at: string;
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
    throw new ApiError(
      401,
      'UNAUTHORIZED',
      '로그인이 필요합니다.',
    );
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

// ========================================
// Mock Data
// ========================================

const initialTime = new Date().toISOString();

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
  cur_region: {
    id: 1,
    code: 'R01',
    name: '청송',
  },
  last_settled_at: initialTime,
  claimable_at: new Date(
    Date.parse(initialTime) + MIN_CLAIM_SECONDS * 1000,
  ).toISOString(),
  state_version: 1,
  server_time: initialTime,
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
    piece_drop_bp: 60,
    specialty: {
      id: 1,
      name: '사과',
      pieces: 20,
      required_pieces: 20,
    },
    status: 'CURRENT',
    unlocked_at: initialTime,
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
    piece_drop_bp: 55,
    specialty: {
      id: 2,
      name: '간고등어',
      pieces: 0,
      required_pieces: 20,
    },
    status: 'UNLOCKED',
    unlocked_at: initialTime,
    unlock: {
      region_id: 1,
      region_name: '청송',
      specialty_name: '사과',
      required_pieces: 20,
      current_pieces: 20,
    },
  },
];

// 동일 요청 키 중복 수령 방지
const mockClaimResults = new Map<string, IdleRewardClaim>();

// 지역별 남은 시간과 연속 실패 횟수
const mockMobStates = new Map<
  number,
  { carry: number; fails: number }
>();

function getMockRegion(): ExploreRegion | undefined {
  return mockRegions.find(
    (region) => region.id === mockUser.cur_region.id,
  );
}

function getMockElapsedSeconds(): number {
  const elapsed = Math.floor(
    (Date.now() - Date.parse(mockUser.last_settled_at)) / 1000,
  );

  return Math.max(0, elapsed);
}

function calculateMockReward(): IdleRewardPreview {
  const elapsed = getMockElapsedSeconds();
  const cappedSeconds = Math.min(elapsed, IDLE_CAP_SECONDS);

  const region = getMockRegion();
  const goldPerMinute = region?.gold_per_minute ?? 0;
  const expPerMinute = region?.exp_per_minute ?? 0;

  const gold = Math.floor(
    (cappedSeconds / 60) *
      goldPerMinute *
      (1 + mockUser.total_gold_bonus_percent / 100),
  );

  const exp = Math.floor(
    (cappedSeconds / 60) * expPerMinute,
  );

  const carry =
    mockMobStates.get(region?.id ?? 0)?.carry ?? 0;

  const mobsDefeated = Math.floor(
    (cappedSeconds + carry) / SECONDS_PER_MOB,
  );

  return {
    elapsed_seconds: cappedSeconds,
    cap_seconds: IDLE_CAP_SECONDS,
    capped: elapsed >= IDLE_CAP_SECONDS,
    claimable: elapsed >= MIN_CLAIM_SECONDS,
    seconds_until_claimable: Math.max(
      0,
      MIN_CLAIM_SECONDS - elapsed,
    ),
    gold,
    exp,
    level_after: mockUser.level,
    piece_judgments: mobsDefeated,
    mobs_defeated: mobsDefeated,
    server_time: new Date().toISOString(),
  };
}

function applyMockExperience(
  gainedExp: number,
): {
  level: number;
  exp: number;
  expToNextLevel: number;
} {
  let level = mockUser.level;
  let exp = mockUser.exp + gainedExp;
  let expToNextLevel = mockUser.exp_to_next_level;

  while (expToNextLevel > 0 && exp >= expToNextLevel) {
    exp -= expToNextLevel;
    level += 1;
    expToNextLevel = level * 50;
  }

  return {
    level,
    exp,
    expToNextLevel,
  };
}

function settleMockReward(
  requireClaimable: boolean,
): IdleRewardClaim {
  const preview = calculateMockReward();

  if (requireClaimable && !preview.claimable) {
    throw new ApiError(
      409,
      'REWARD_NOT_CLAIMABLE',
      '보상은 탐험 시작 1분 후부터 수령할 수 있어요.',
    );
  }

  const previousLevel = mockUser.level;
  const experience = applyMockExperience(preview.exp);
  const region = getMockRegion();

  const regionId = region?.id ?? 1;

  const mobState = mockMobStates.get(regionId) ?? {
    carry: 0,
    fails: 0,
  };

  const mobsDefeated = preview.mobs_defeated;

  const nextCarry =
    (preview.elapsed_seconds + mobState.carry) %
    SECONDS_PER_MOB;

  let gainedPieces = 0;
  let consecutiveFails = mobState.fails;

  const dropRate = region?.piece_drop_bp ?? 60;

  // 몬스터 1마리마다 특산물 조각 드롭 판정
  for (let i = 0; i < mobsDefeated; i += 1) {
    const success =
      consecutiveFails >= GUARANTEED_AFTER_FAILS ||
      Math.floor(Math.random() * 10000) < dropRate;

    if (success) {
      gainedPieces += 1;
      consecutiveFails = 0;
    } else {
      consecutiveFails += 1;
    }
  }

  mockMobStates.set(regionId, {
    carry: nextCarry,
    fails: consecutiveFails,
  });

  const settledAt = new Date().toISOString();

  if (region) {
    region.specialty.pieces += gainedPieces;
  }

  mockUser = {
    ...mockUser,
    gold: mockUser.gold + preview.gold,
    level: experience.level,
    exp: experience.exp,
    exp_to_next_level: experience.expToNextLevel,
    state_version: mockUser.state_version + 1,
    last_settled_at: settledAt,
    claimable_at: new Date(
      Date.parse(settledAt) + MIN_CLAIM_SECONDS * 1000,
    ).toISOString(),
    server_time: settledAt,
  };

  return {
    gold: mockUser.gold,
    level: mockUser.level,
    exp: mockUser.exp,
    exp_to_next_level: mockUser.exp_to_next_level,
    gained: {
      elapsed_seconds: preview.elapsed_seconds,
      capped: preview.capped,
      gold: preview.gold,
      exp: preview.exp,
      mobs_defeated: mobsDefeated,
      pieces: {
        region_id: regionId,
        specialty_id: region?.specialty.id ?? 1,
        name: region?.specialty.name ?? '사과',
        judgments: mobsDefeated,
        drop_rate_bp: dropRate,
        gained: gainedPieces,
        total: region?.specialty.pieces ?? 0,
        carry_seconds: nextCarry,
        consecutive_fails: consecutiveFails,
      },
      unlocked_regions: [],
    },
    leveled_up: experience.level > previousLevel,
    previous_level: previousLevel,
    state_version: mockUser.state_version,
    settled_at: settledAt,
  };
}

// ========================================
// Mock API
// ========================================

const mockApi = {
  async getUser(): Promise<ExploreUser> {
    return structuredClone({
      ...mockUser,
      server_time: new Date().toISOString(),
    });
  },

  async getRegions(): Promise<{
    regions: ExploreRegion[];
  }> {
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

  async getIdleReward(): Promise<IdleRewardPreview> {
    return calculateMockReward();
  },

  async claimIdleReward(
    idempotencyKey: string,
  ): Promise<IdleRewardClaim> {
    const previousResult =
      mockClaimResults.get(idempotencyKey);

    if (previousResult) {
      return structuredClone(previousResult);
    }

    const result = settleMockReward(true);

    mockClaimResults.set(
      idempotencyKey,
      structuredClone(result),
    );

    return structuredClone(result);
  },

  async moveRegion(
    targetRegionId: number,
    idempotencyKey: string,
  ): Promise<MoveRegionResponse> {
    void idempotencyKey;

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

    const previousRegion = structuredClone(
      mockUser.cur_region,
    );

    // 지역 변경 전 기존 지역 보상 정산
    const settlement = settleMockReward(false);
    const startedAt = settlement.settled_at;

    mockUser = {
      ...mockUser,
      cur_region: {
        id: target.id,
        code: target.code,
        name: target.name,
      },
      state_version: mockUser.state_version + 1,
    };

    return {
      gold: mockUser.gold,
      level: mockUser.level,
      exp: mockUser.exp,
      exp_to_next_level: mockUser.exp_to_next_level,
      cur_region: structuredClone(mockUser.cur_region),
      previous_region: previousRegion,
      settled: structuredClone(settlement.gained),
      state_version: mockUser.state_version,
      started_at: startedAt,
    };
  },
};

// ========================================
// Public API
// ========================================

export const exploreApi = {
  getUser(): Promise<ExploreUser> {
    return USE_MOCK
      ? mockApi.getUser()
      : request<ExploreUser>('/user');
  },

  getRegions(): Promise<{
    regions: ExploreRegion[];
  }> {
    return USE_MOCK
      ? mockApi.getRegions()
      : request<{ regions: ExploreRegion[] }>('/regions');
  },

  getIdleReward(): Promise<IdleRewardPreview> {
    return USE_MOCK
      ? mockApi.getIdleReward()
      : request<IdleRewardPreview>('/idle-reward');
  },

  claimIdleReward(
    idempotencyKey: string,
  ): Promise<IdleRewardClaim> {
    return USE_MOCK
      ? mockApi.claimIdleReward(idempotencyKey)
      : request<IdleRewardClaim>('/idle-reward', {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        });
  },

  moveRegion(
    targetRegionId: number,
    idempotencyKey: string = crypto.randomUUID(),
  ): Promise<MoveRegionResponse> {
    return USE_MOCK
      ? mockApi.moveRegion(targetRegionId, idempotencyKey)
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
