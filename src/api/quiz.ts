import { clearSession } from './session';
import { ApiError, exploreApi } from './explore';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:3000/api/v1';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';
const MOCK_KEY = 'gyeongbuk-quiz-daily-v2';

export interface QuizQuestion {
  order_no: number;
  question_id: number;
  question: string;
  choices: string[];
  selected_index: number | null;
}

export interface QuizAnswer {
  order_no: number;
  selected_index: number;
  answer_index: number;
  is_correct: boolean;
  explanation: string;
}

export interface QuizResult {
  correct_count: number;
  total: number;
  rewarded: { gold: number; exp: number };
  answers: QuizAnswer[];
  submitted_at: string;
}

export interface QuizSet {
  set_id: number;
  quiz_date: string;
  region: { id: number; code: string; name: string };
  status: 'ISSUED' | 'SUBMITTED';
  questions: QuizQuestion[];
  result: QuizResult | null;
}

export interface SubmitAnswer {
  order_no: number;
  selected_index: number;
}

export interface QuizSubmitResponse {
  set: QuizSet;
  gold: number;
  level: number;
  exp: number;
  exp_to_next_level: number;
  leveled_up: boolean;
  state_version: number;
}

interface SeedQuestion {
  id: number;
  content: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
}

// 백엔드 src/database/seeds/content-data.ts와 동일한 문제
const QUIZ_SEEDS: Record<number, SeedQuestion[]> = {
  1: [
    {
      id: 1,
      content:
        '2017년 청송군 전역이 인정받은 유네스코 지정 명칭은 무엇일까요?',
      choices: [
        '세계지질공원',
        '세계기록유산',
        '인류무형문화유산',
        '창의도시',
      ],
      answerIndex: 0,
      explanation:
        '청송군은 지질학적 가치와 함께 생태·문화적 가치를 평가받아 2017년 군 전역이 유네스코 세계지질공원으로 인정받았습니다.',
    },
    {
      id: 2,
      content:
        '청송과 영덕에 걸쳐 있는 주왕산이 국립공원으로 지정된 해는 언제일까요?',
      choices: ['1967년', '1976년', '1988년', '2001년'],
      answerIndex: 1,
      explanation:
        '주왕산은 1976년 3월 30일에 12번째 국립공원으로 지정되었습니다.',
    },
    {
      id: 3,
      content:
        '청송 사과의 재배 환경으로 자주 꼽히는 특징은 무엇일까요?',
      choices: [
        '바닷바람이 강한 해안 지형',
        '일 년 내내 높은 기온',
        '낮과 밤의 큰 기온 차',
        '넓은 저지대 평야',
      ],
      answerIndex: 2,
      explanation:
        '청송은 고도가 높은 분지 지형이라 일교차가 큰 편이며, 이 환경이 청송 사과의 특징으로 자주 소개됩니다.',
    },
  ],
  2: [
    {
      id: 4,
      content:
        '옛날 안동 사람들이 해산물을 주로 가져온, 가까운 해안의 항구는 어디일까요?',
      choices: ['부산항', '인천항', '영덕 강구항', '목포항'],
      answerIndex: 2,
      explanation:
        '안동에서 가장 가까운 해안인 영덕 강구항에서 해산물을 운반해 왔으며, 이 길을 따라 간고등어가 생겨났다고 전해집니다.',
    },
    {
      id: 5,
      content:
        '안동으로 가져오는 고등어를 소금에 절인 가장 큰 이유는 무엇일까요?',
      choices: [
        '운반하는 동안 상하지 않게 하려고',
        '고등어의 색을 밝게 하려고',
        '무게를 늘려 비싸게 팔려고',
        '제사에만 쓰도록 구별하려고',
      ],
      answerIndex: 0,
      explanation:
        '냉동 시설이 없던 때라 먼 길을 오는 동안 상하지 않도록 소금으로 염장했습니다.',
    },
    {
      id: 6,
      content:
        '고등어에 소금을 쳐서 간을 맞추는 사람을 무엇이라고 부를까요?',
      choices: ['뱃사공', '간잽이', '보부상', '바지게꾼'],
      answerIndex: 1,
      explanation:
        '소금으로 간을 맞추는 사람을 간잽이라고 부릅니다. 바지게꾼은 고등어를 등에 지고 나르던 사람입니다.',
    },
  ],
};

function koreaToday(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${value('year')}-${value('month')}-${value('day')}`;
}

function readMock(): QuizSet | null {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    if (!raw) return null;

    const set = JSON.parse(raw) as QuizSet;
    return set.quiz_date === koreaToday() ? set : null;
  } catch {
    return null;
  }
}

function saveMock(set: QuizSet) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(set));
}

function copySet(set: QuizSet): QuizSet {
  return structuredClone(set);
}

async function mockIssue(): Promise<{
  created: boolean;
  set: QuizSet;
}> {
  const existing = readMock();

  if (existing) {
    return { created: false, set: copySet(existing) };
  }

  // 별도의 임의 지역 설정 대신 탐험 Mock의 현재 지역 사용
  const user = await exploreApi.getUser();
  const region = user.cur_region;
  const bank = QUIZ_SEEDS[region.id];

  if (!bank || bank.length < 3) {
    throw new ApiError(
      409,
      'QUIZ_NOT_AVAILABLE',
      '현재 지역의 퀴즈가 준비되지 않았어요.',
    );
  }

  const date = koreaToday();
  const shuffled = [...bank].sort(() => Math.random() - 0.5);

  const set: QuizSet = {
    set_id: Number(date.replaceAll('-', '')),
    quiz_date: date,
    region: {
      id: region.id,
      code: region.code,
      name: region.name,
    },
    status: 'ISSUED',
    questions: shuffled.slice(0, 3).map((quiz, index) => ({
      order_no: index + 1,
      question_id: quiz.id,
      question: quiz.content,
      choices: [...quiz.choices],
      selected_index: null,
    })),
    result: null,
  };

  saveMock(set);
  return { created: true, set: copySet(set) };
}

async function mockToday(): Promise<QuizSet> {
  const set = readMock();

  if (!set) {
    throw new ApiError(
      404,
      'QUIZ_SET_NOT_ISSUED',
      '오늘의 퀴즈가 아직 발급되지 않았어요.',
    );
  }

  return copySet(set);
}

async function mockSubmit(
  setId: number,
  answers: SubmitAnswer[],
): Promise<QuizSubmitResponse> {
  const set = readMock();

  if (!set || set.set_id !== setId) {
    throw new ApiError(
      404,
      'QUIZ_SET_NOT_FOUND',
      '퀴즈 세트를 찾을 수 없어요.',
    );
  }

  if (set.status === 'SUBMITTED') {
    throw new ApiError(
      409,
      'QUIZ_ALREADY_SUBMITTED',
      '오늘의 퀴즈에 이미 참여했어요.',
    );
  }

  const validOrders = new Set(
    set.questions.map((question) => question.order_no),
  );

  if (
    answers.length !== 3 ||
    new Set(answers.map((a) => a.order_no)).size !== 3 ||
    answers.some(
      (a) =>
        !validOrders.has(a.order_no) ||
        !Number.isInteger(a.selected_index) ||
        a.selected_index < 0 ||
        a.selected_index > 3,
    )
  ) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      '세 문제 모두 답변해 주세요.',
    );
  }

  const resultAnswers: QuizAnswer[] = set.questions.map(
    (question) => {
      const answer = answers.find(
        (item) => item.order_no === question.order_no,
      )!;

      const seed = QUIZ_SEEDS[set.region.id].find(
        (item) => item.id === question.question_id,
      )!;

      question.selected_index = answer.selected_index;

      return {
        order_no: question.order_no,
        selected_index: answer.selected_index,
        answer_index: seed.answerIndex,
        is_correct:
          answer.selected_index === seed.answerIndex,
        explanation: seed.explanation,
      };
    },
  );

  set.status = 'SUBMITTED';
  set.result = {
    correct_count: resultAnswers.filter((a) => a.is_correct)
      .length,
    total: 3,
    rewarded: { gold: 100, exp: 20 },
    answers: resultAnswers,
    submitted_at: new Date().toISOString(),
  };

  saveMock(set);

  const user = await exploreApi.getUser();

  // 개발용 응답. 실제 DB 잔액은 변경하지 않음
  return {
    set: copySet(set),
    gold: user.gold + 100,
    level: user.level,
    exp: user.exp + 20,
    exp_to_next_level: user.exp_to_next_level,
    leveled_up: false,
    state_version: user.state_version + 1,
  };
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
      clearSession();
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

export const quizApi = {
  issue(): Promise<{ created: boolean; set: QuizSet }> {
    return USE_MOCK
      ? mockIssue()
      : request('/quiz/today', { method: 'POST' });
  },

  today(): Promise<QuizSet> {
    return USE_MOCK
      ? mockToday()
      : request('/quiz/today');
  },

  submit(
    setId: number,
    answers: SubmitAnswer[],
    idempotencyKey: string,
  ): Promise<QuizSubmitResponse> {
    return USE_MOCK
      ? mockSubmit(setId, answers)
      : request('/quiz/submit', {
          method: 'POST',
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            set_id: setId,
            answers,
          }),
        });
  },
};
