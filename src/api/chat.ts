import { clearSession } from './session';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:3000/api/v1'
).replace(/\/$/, '');

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';

export const OPEN_CHAT_EVENT = 'gyeongbuk:open-chat';

export interface ChatRecommendation {
  specialty_id: number;
  name: string;
  region: string;
  product: { title: string } | null;
}

export interface ChatResponse {
  reply: string;
  source: 'AI' | 'TEMPLATE';
  recommendation: ChatRecommendation | null;
}

export async function sendChatMessage(
  message: string,
): Promise<ChatResponse> {
  if (USE_MOCK) {
    return {
      reply:
        '달콤한 과일을 좋아하시는군요!\n청송 사과를 추천해 드릴게요.',
      source: 'TEMPLATE',
      recommendation: {
        specialty_id: 1,
        name: '사과',
        region: '청송',
        product: { title: '햇살 과수원 사과' },
      },
    };
  }

  const token = localStorage.getItem('access_token');

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token ?? ''}`,
    },
    body: JSON.stringify({ message }),
  });

  if (response.status === 401) {
    clearSession();
  }

  if (response.status === 429) {
    throw new Error('요청이 많아요. 잠시 후 다시 물어봐 주세요.');
  }

  if (!response.ok) {
    throw new Error('답변을 불러오지 못했어요. 다시 시도해 주세요.');
  }

  return response.json() as Promise<ChatResponse>;
}
