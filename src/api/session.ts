// 체험 계정의 토큰을 보관하고, 토큰이 없거나 만료되면 캐릭터 생성 화면으로 돌려보냅니다.
const TOKEN_KEY = 'access_token';
const SESSION_EXPIRED_EVENT = 'gyeongbuk:session-expired';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:3000/api/v1'
).replace(/\/$/, '');

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';

interface ErrorBody {
  code?: string;
  details?: { reason?: string } | null;
}

export function hasSession(): boolean {
  if (USE_MOCK) return true;

  try {
    return localStorage.getItem(TOKEN_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // 저장소를 쓸 수 없어도 화면 전환은 진행합니다.
  }

  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function onSessionExpired(listener: () => void): () => void {
  window.addEventListener(SESSION_EXPIRED_EVENT, listener);

  return () => {
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
  };
}

function createErrorMessage(body: ErrorBody | null): string {
  if (body?.code === 'NAME_DUPLICATED') {
    return '이미 사용 중인 이름이에요.';
  }

  if (body?.code === 'RATE_LIMITED') {
    return '요청이 많아요. 잠시 후 다시 시도해 주세요.';
  }

  switch (body?.details?.reason) {
    case 'LENGTH':
      return '이름은 2~10자로 입력해 주세요.';
    case 'CHARSET':
      return '이름은 한글, 영문, 숫자만 쓸 수 있어요.';
    case 'BANNED_WORD':
      return '사용할 수 없는 단어가 들어 있어요.';
    default:
      return '캐릭터를 만들지 못했어요. 다시 시도해 주세요.';
  }
}

export async function createCharacter(name: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => null)) as ErrorBody | null;

    throw new Error(createErrorMessage(body));
  }

  const { jwt } = (await response.json()) as { jwt: string };
  localStorage.setItem(TOKEN_KEY, jwt);
}
