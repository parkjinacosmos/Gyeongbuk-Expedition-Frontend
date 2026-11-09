import { useEffect, useState } from 'react';

import {
  codexApi,
  type CodexDetail,
  type CodexItem,
  type CodexSummary,
} from '../../api/codex';

import {
  exploreApi,
  type ExploreUser,
  type ExploreRegion,
} from '../../api/explore';

import GameHeader from '../../components/GameHeader/GameHeader';
import GameMenu from '../../components/GameMenu/GameMenu';

import bookCover from '../../assets/book/book-cover.svg';
import bookPaper from '../../assets/book/book-paper.svg';

import appleImage from '../../assets/explore/apple.png';
import mackerelImage from '../../assets/explore/mackerel.png';
import ginsengImage from '../../assets/explore/ginseng.png';
import omijaImage from '../../assets/explore/omija.png';
import persimmonImage from '../../assets/explore/persimmon.png';
import melonImage from '../../assets/explore/melon.png';
import garlicImage from '../../assets/explore/garlic.png';
import gwamegiImage from '../../assets/explore/gwamegi.png';

import './BookPage.css';

interface BookPageProps {
  onOpenMap?: () => void;
  onOpenQuiz?: () => void;
}

interface SpecialtySlot {
  key: string;
  name: string;
  region: string;
  image: string;
  aliases: string[];
}

const specialtySlots: SpecialtySlot[] = [
  {
    key: 'apple',
    name: '청송 사과',
    region: '청송',
    image: appleImage,
    aliases: ['청송 사과', '사과'],
  },
  {
    key: 'mackerel',
    name: '안동 간고등어',
    region: '안동',
    image: mackerelImage,
    aliases: ['안동 간고등어', '간고등어'],
  },
  {
    key: 'ginseng',
    name: '영주 풍기인삼',
    region: '영주',
    image: ginsengImage,
    aliases: ['영주 풍기인삼', '풍기인삼', '인삼'],
  },
  {
    key: 'omija',
    name: '문경 오미자',
    region: '문경',
    image: omijaImage,
    aliases: ['문경 오미자', '오미자'],
  },
  {
    key: 'persimmon',
    name: '상주 곶감',
    region: '상주',
    image: persimmonImage,
    aliases: ['상주 곶감', '곶감'],
  },
  {
    key: 'melon',
    name: '성주 참외',
    region: '성주',
    image: melonImage,
    aliases: ['성주 참외', '참외'],
  },
  {
    key: 'garlic',
    name: '의성 마늘',
    region: '의성',
    image: garlicImage,
    aliases: ['의성 마늘', '마늘'],
  },
  {
    key: 'gwamegi',
    name: '포항 과메기',
    region: '포항',
    image: gwamegiImage,
    aliases: ['포항 과메기', '과메기'],
  },
];

function normalizeName(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function matchesSlot(
  item: CodexItem,
  slot: SpecialtySlot,
): boolean {
  const itemName = normalizeName(item.name);

  return slot.aliases.some((alias) => {
    const normalized = normalizeName(alias);

    return (
      itemName === normalized ||
      itemName.includes(normalized)
    );
  });
}

function getStateLabel(state: CodexItem['state']): string {
  switch (state) {
    case 'COMPLETED':
      return '수집 완료';
    case 'COLLECTING':
      return '수집 중';
    default:
      return '미수집';
  }
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function BookPage({
  onOpenMap,
  onOpenQuiz,
}: BookPageProps) {
  const [user, setUser] = useState<ExploreUser | null>(null);
  const [items, setItems] = useState<CodexItem[]>([]);
  const [, setSummary] =
    useState<CodexSummary | null>(null);
  const [regions, setRegions] = useState<ExploreRegion[]>([]);

  const [selectedId, setSelectedId] =
    useState<number | null>(null);
  const [detail, setDetail] =
    useState<CodexDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBook() {
      setLoading(true);
      setError('');

      const [userResult, codexResult, regionResult] =
        await Promise.allSettled([
          exploreApi.getUser(),
          codexApi.getCodex(),
          exploreApi.getRegions(),
        ]);

      if (cancelled) return;

      if (userResult.status === 'fulfilled') {
        setUser(userResult.value);
      } else {
        console.error(
          '[Book API] 사용자 조회 실패',
          userResult.reason,
        );
      }

      if (regionResult.status === 'fulfilled') {
        setRegions(regionResult.value.regions);

        if (import.meta.env.DEV) {
          console.log(
            '[Book API] 지역 조회 성공',
            regionResult.value,
          );
        }
      } else {
        console.error(
          '[Book API] 지역 조회 실패',
          regionResult.reason,
        );
      }

      if (codexResult.status === 'fulfilled') {
        const data = codexResult.value;

        setItems(data.items);
        setSummary(data.summary);

        const firstAvailable =
          data.items.find(
            (item) => item.state !== 'UNDISCOVERED',
          ) ?? data.items[0];

        setSelectedId(firstAvailable?.id ?? null);

        if (import.meta.env.DEV) {
          console.log('[Book API] 도감 조회 성공', data);

          console.table(
            data.items.map((item) => ({
              id: item.id,
              name: item.name,
              region: item.region.name,
              regionStatus: item.region.status,
              state: item.state,
              pieces: item.pieces,
              requiredPieces: item.required_pieces,
            })),
          );
        }
      } else {
        console.error(
          '[Book API] 도감 조회 실패',
          codexResult.reason,
        );

        setError('도감 정보를 불러오지 못했어요.');
      }

      setLoading(false);
    }

    void loadBook();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedId === null) {
      setDetail(null);
      setDetailLoading(false);
      return;
    }

    const specialtyId = selectedId;
    let cancelled = false;

    async function loadDetail() {
      setDetail(null);
      setDetailError('');
      setDetailLoading(true);

      try {
        const result = await codexApi.getDetail(specialtyId);

        if (cancelled) return;

        setDetail(result);

        if (import.meta.env.DEV) {
          console.log(
            `[Book API] 상세 조회 성공 (${specialtyId})`,
            result,
          );
        }
      } catch (err) {
        if (cancelled) return;

        console.error(
          `[Book API] 상세 조회 실패 (${specialtyId})`,
          err,
        );

        setDetailError('상세 정보를 불러오지 못했어요.');
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const matchedIds = new Set<number>();

  const slots = specialtySlots.map((slot) => {
    const item = items.find(
      (candidate) =>
        !matchedIds.has(candidate.id) &&
        matchesSlot(candidate, slot),
    );

    if (item) {
      matchedIds.add(item.id);
    }

    return { slot, item };
  });

  const extraItems = items.filter(
    (item) => !matchedIds.has(item.id),
  );

  const selectedItem =
    items.find((item) => item.id === selectedId) ?? null;

  const displayItem =
    detail && detail.id === selectedId
      ? detail
      : selectedItem;

  const selectedSlot = displayItem
    ? specialtySlots.find((slot) =>
        matchesSlot(displayItem, slot),
      )
    : null;

  const selectedImage =
    selectedSlot?.image ??
    displayItem?.image_url ??
    null;

  const openedRegionCount = regions.filter(
    (region) =>
      region.status === 'CURRENT' ||
      region.status === 'UNLOCKED',
  ).length;

  const collectedPieces = items.reduce(
    (total, item) => total + item.pieces,
    0,
  );

  function handleOpenMap() {
    setMenuOpen(false);

    if (onOpenMap) {
      onOpenMap();
    } else {
      setNotice('지도 이동 기능이 연결되지 않았어요.');
    }
  }

  function handleOpenQuiz() {
    setMenuOpen(false);

    if (onOpenQuiz) {
      onOpenQuiz();
    } else {
      setNotice('퀴즈 이동 기능이 연결되지 않았어요.');
    }
  }

  return (
    <main className="book-page">
      <div className="book-page__content">
        <GameHeader
          user={user}
          variant="character"
          menuOpen={menuOpen}
          onOpenMenu={() => setMenuOpen((prev) => !prev)}
          onAddGold={() =>
            setNotice('골드 충전 기능은 준비 중이에요.')
          }
        />

        <div className="book-page__sign">
          <span>도감</span>
        </div>

        <section className="book-page__panel">
          <div
            className="book-page__background"
            aria-hidden="true"
          >
            <img
              className="book-page__cover"
              src={bookCover}
              alt=""
            />
            <img
              className="book-page__paper"
              src={bookPaper}
              alt=""
            />
          </div>

          {/* 책갈피는 책 전체를 기준으로 배치 */}
          <div
            className="book-page__ribbon"
            aria-hidden="true"
          />

          <div className="book-page__inner">
            <h1 className="book-page__heading">
              경북 특산물 도감
            </h1>

            {loading ? (
              <p className="book-page__message">
                도감을 불러오는 중이에요...
              </p>
            ) : error ? (
              <p className="book-page__message book-page__message--error">
                {error}
              </p>
            ) : (
              <>
                <div className="book-page__summary">
                  <span>
                    {`${openedRegionCount}/8`} 지역 개방
                  </span>

                  <span>
                    수집 조각 {collectedPieces}개
                  </span>
                </div>

                <div className="book-page__grid">
                  {slots.map(({ slot, item }) => {
                    const isSelected =
                      !!item && selectedId === item.id;

                    const isLocked =
                      !item ||
                      item.state === 'UNDISCOVERED';

                    return (
                      <button
                        key={slot.key}
                        type="button"
                        disabled={!item}
                        aria-pressed={isSelected}
                        className={[
                          'book-page__item',
                          isSelected ? 'is-selected' : '',
                          isLocked ? 'is-locked' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => {
                          if (item) setSelectedId(item.id);
                        }}
                      >
                        <span className="book-page__item-badge">
                          {item
                            ? getStateLabel(item.state)
                            : '미수집'}
                        </span>

                        <span className="book-page__item-image">
                          <img
                            src={slot.image}
                            alt=""
                            className={
                              isLocked ? 'is-grayscale' : ''
                            }
                          />

                          {isLocked && (
                            <span className="book-page__lock">
                              <LockIcon />
                            </span>
                          )}
                        </span>

                        <strong>{slot.name}</strong>
                        <small>{slot.region}</small>
                      </button>
                    );
                  })}

                  {extraItems.map((item) => {
                    const isLocked =
                      item.state === 'UNDISCOVERED';

                    return (
                      <button
                        key={`extra-${item.id}`}
                        type="button"
                        aria-pressed={selectedId === item.id}
                        className={[
                          'book-page__item',
                          selectedId === item.id
                            ? 'is-selected'
                            : '',
                          isLocked ? 'is-locked' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <span className="book-page__item-badge">
                          {getStateLabel(item.state)}
                        </span>

                        <span className="book-page__item-image">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt=""
                              className={
                                isLocked ? 'is-grayscale' : ''
                              }
                            />
                          ) : (
                            <span>?</span>
                          )}

                          {isLocked && (
                            <span className="book-page__lock">
                              <LockIcon />
                            </span>
                          )}
                        </span>

                        <strong>{item.name}</strong>
                        <small>{item.region.name}</small>
                      </button>
                    );
                  })}
                </div>

                {displayItem && (
                  <section className="book-page__detail">
                    <div className="book-page__detail-image">
                      {selectedImage ? (
                        <img
                          src={selectedImage}
                          alt=""
                          className={
                            displayItem.state === 'UNDISCOVERED'
                              ? 'is-grayscale'
                              : ''
                          }
                        />
                      ) : (
                        <span>?</span>
                      )}
                    </div>

                    <div className="book-page__detail-content">
                      <h2>
                        {selectedSlot?.name ??
                          displayItem.name}
                      </h2>

                      <span className="book-page__detail-state">
                        {getStateLabel(displayItem.state)}
                      </span>

                      <p>
                        {detailLoading
                          ? '상세 정보를 불러오는 중이에요...'
                          : detailError
                            ? detailError
                            : displayItem.state === 'UNDISCOVERED'
                              ? '아직 수집하지 않은 특산물이에요.'
                              : detail?.description ??
                                '특산물 소개가 준비 중이에요.'}
                      </p>

                      <small>
                        수집 조각 {displayItem.pieces}/
                        {displayItem.required_pieces}
                      </small>
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </section>

        {notice && (
          <div className="book-page__notice" role="status">
            <span>{notice}</span>
            <button
              type="button"
              aria-label="알림 닫기"
              onClick={() => setNotice('')}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {menuOpen && (
        <GameMenu
          onClose={() => setMenuOpen(false)}
          onOpenMap={handleOpenMap}
          onOpenQuiz={handleOpenQuiz}
          onNotice={setNotice}
        />
      )}
    </main>
  );
}
