import { clearSession } from './session';
import type {
  ExploreUser,
  SettledReward,
} from './explore';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:3000/api/v1'
).replace(/\/+$/, '');

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK_API !== 'false';

export interface EquipmentInfo {
  stage: number;
  gold_bonus_percent: number;
  max_stage: number;
  is_max: boolean;
  next: {
    stage: number;
    gold_bonus_percent: number;
    upgrade_cost: number;
    required_level: number;
  } | null;
  gold: number;
  gold_after_settle: number;
  level_after_settle: number;
  can_upgrade: boolean;
  blocked_by: string[];
}

export interface EquipmentUpgradeResponse {
  gold: number;
  level: number;
  exp: number;
  exp_to_next_level: number;
  equipment: ExploreUser['equipment'];
  cost: number;
  settled: SettledReward;
  state_version: number;
  settled_at: string;
}

export class CharacterApiError extends Error {
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

    this.name = 'CharacterApiError';
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
    throw new CharacterApiError(
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
      clearSession();
    }

    throw new CharacterApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? '요청에 실패했습니다.',
      error?.details ?? null,
    );
  }

  return response.json() as Promise<T>;
}

let mockStage = 1;
let mockGold = 640;
const mockResults =
  new Map<string, EquipmentUpgradeResponse>();

const COSTS = [0, 100, 250, 500, 900];
const LEVELS = [0, 1, 3, 6, 10];

function getMockEquipment(): EquipmentInfo {
  const nextStage = mockStage + 1;
  const isMax = mockStage >= 5;
  const next = isMax
    ? null
    : {
        stage: nextStage,
        gold_bonus_percent: (nextStage - 1) * 10,
        upgrade_cost: COSTS[mockStage],
        required_level: LEVELS[mockStage],
      };

  const blockedBy: string[] = [];

  if (isMax) {
    blockedBy.push('MAX_STAGE');
  } else if (next) {
    if (mockGold < next.upgrade_cost) {
      blockedBy.push('GOLD');
    }
    if (3 < next.required_level) {
      blockedBy.push('LEVEL');
    }
  }

  return {
    stage: mockStage,
    gold_bonus_percent: (mockStage - 1) * 10,
    max_stage: 5,
    is_max: isMax,
    next,
    gold: mockGold,
    gold_after_settle: mockGold,
    level_after_settle: 3,
    can_upgrade: blockedBy.length === 0,
    blocked_by: blockedBy,
  };
}

export const characterApi = {
  async getEquipment(): Promise<EquipmentInfo> {
    return USE_MOCK
      ? getMockEquipment()
      : request<EquipmentInfo>('/equipment');
  },

  async upgradeEquipment(
    idempotencyKey: string,
  ): Promise<EquipmentUpgradeResponse> {
    if (!USE_MOCK) {
      return request<EquipmentUpgradeResponse>(
        '/equipment/upgrade',
        {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        },
      );
    }

    const previous = mockResults.get(idempotencyKey);
    if (previous) return structuredClone(previous);

    const current = getMockEquipment();

    if (!current.can_upgrade || !current.next) {
      throw new CharacterApiError(
        409,
        'EQUIPMENT_REQUIREMENTS_NOT_MET',
        '강화 조건을 충족하지 못했어요.',
      );
    }

    const cost = current.next.upgrade_cost;
    mockGold -= cost;
    mockStage += 1;

    const result: EquipmentUpgradeResponse = {
      gold: mockGold,
      level: 3,
      exp: 150,
      exp_to_next_level: 150,
      equipment: {
        stage: mockStage,
        gold_bonus_percent: (mockStage - 1) * 10,
        next_upgrade_cost:
          mockStage < 5 ? COSTS[mockStage] : null,
        next_required_level:
          mockStage < 5 ? LEVELS[mockStage] : null,
      },
      cost,
      settled: {} as SettledReward,
      state_version: mockStage,
      settled_at: new Date().toISOString(),
    };

    mockResults.set(idempotencyKey, result);
    return structuredClone(result);
  },
};
