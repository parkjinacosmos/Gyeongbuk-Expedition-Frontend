import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import './ChatPage.css';

import { sendChatMessage } from '../../api/chat';
import type { ChatRecommendation } from '../../api/chat';
import { exploreApi } from '../../api/explore';

import lionImage from '../../assets/popup/lion.png';
import productImage from '../../assets/shop/orchard-apple-basket.png';

interface ChatPageProps {
  onClose: () => void;
  onOpenShop: () => void;
}

interface ChatEntry {
  id: number;
  from: 'bot' | 'user';
  text: string;
  recommendation?: ChatRecommendation | null;
}

const MAX_LENGTH = 200;

export default function ChatPage({
  onClose,
  onOpenShop,
}: ChatPageProps) {
  const [name, setName] = useState('모험가');
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);

  const nextId = useRef(1);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    exploreApi
      .getUser()
      .then((user) => {
        if (!cancelled && user.name) setName(user.name);
      })
      .catch(() => {
        // 이름을 못 불러와도 기본 호칭으로 대화할 수 있습니다.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const log = logRef.current;

    if (log) log.scrollTop = log.scrollHeight;
  }, [entries, pending]);

  function append(entry: Omit<ChatEntry, 'id'>) {
    const id = nextId.current;
    nextId.current += 1;
    setEntries((current) => [...current, { ...entry, id }]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const message = draft.trim();

    if (!message || pending) return;

    setDraft('');
    append({ from: 'user', text: message });
    setPending(true);

    try {
      const response = await sendChatMessage(message);

      append({
        from: 'bot',
        text: response.reply,
        recommendation: response.recommendation,
      });
    } catch (error) {
      append({
        from: 'bot',
        text:
          error instanceof Error
            ? error.message
            : '답변을 불러오지 못했어요.',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="chat-page">
      <div className="chat-page__background" aria-hidden="true" />

      <button
        type="button"
        className="chat-page__back"
        onClick={onClose}
        aria-label="돌아가기"
      >
        ‹
      </button>

      <section className="chat-page__panel">
        <div
          ref={logRef}
          className="chat-page__log"
          aria-live="polite"
        >
          <div className="chat-entry chat-entry--bot">
            <img
              src={lionImage}
              alt=""
              className="chat-entry__avatar"
            />
            <div className="chat-entry__bubble">
              <p>
                <strong>{name}</strong>님, 반가워요!
                <br />
                저는 경북 곳곳에
                <br />
                특별한 맛을 찾아드리는 탐험 도우미예요!
              </p>
              <p>
                어떤 특산물을 좋아하시나요?
                <br />
                취향이나 원하는 맛을 알려주면
                <br />
                딱 맞는 지역 특산물을 추천해 드릴게요!
              </p>
            </div>
          </div>

          {entries.map((entry) =>
            entry.from === 'user' ? (
              <div
                key={entry.id}
                className="chat-entry chat-entry--user"
              >
                <div className="chat-entry__bubble">
                  <p>{entry.text}</p>
                </div>
              </div>
            ) : (
              <div
                key={entry.id}
                className="chat-entry chat-entry--bot"
              >
                <img
                  src={lionImage}
                  alt=""
                  className="chat-entry__avatar"
                />
                <div className="chat-entry__bubble">
                  <p>{entry.text}</p>

                  {entry.recommendation?.product && (
                    <div className="chat-entry__product">
                      <img src={productImage} alt="" />
                      <div>
                        <strong>
                          {entry.recommendation.product.title}
                        </strong>
                        <button
                          type="button"
                          onClick={onOpenShop}
                        >
                          상품 살펴보기 &gt;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          )}

          {pending && (
            <div className="chat-entry chat-entry--bot">
              <img
                src={lionImage}
                alt=""
                className="chat-entry__avatar"
              />
              <div className="chat-entry__bubble chat-entry__bubble--pending">
                <p>특산물을 찾아보는 중이에요…</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <form className="chat-page__form" onSubmit={handleSubmit}>
        <div className="chat-page__field">
          <input
            value={draft}
            maxLength={MAX_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="궁금한 내용을 입력하세요..."
            aria-label="궁금한 내용"
          />
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            aria-label="보내기"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5 21 3Z" />
            </svg>
          </button>
        </div>
      </form>
    </main>
  );
}
