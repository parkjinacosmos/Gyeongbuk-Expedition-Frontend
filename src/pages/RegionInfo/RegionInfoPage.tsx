import { useCallback, useEffect, useRef, useState } from 'react';

import {
  exploreApi,
  type ExploreRegion,
  type ExploreUser,
} from '../../api/explore';

import GameMenu from '../../components/GameMenu/GameMenu';

import appleImage from '../../assets/explore/apple.png';
import applePieceImage from '../../assets/explore/apple-piece.png';
import mackerelImage from '../../assets/explore/mackerel.png';
import goldImage from '../../assets/explore/gold.png';
import profileImage from '../../assets/explore/profile.png';
import menuImage from '../../assets/explore/menu.png';

import './RegionInfoPage.css';

interface RegionInfoPageProps {
  regionId: number;
  onBack: () => void;
  onStartExplore: () => void;
}

const regionDesigns = {
  1: {
    product: '사과',
    subtitle: '청송 사과 농장',
    image: appleImage,
    background: '/game/background.png',
  },
  2: {
    product: '간고등어',
    subtitle: '간고등어 나루터',
    image: mackerelImage,
    background: '/regions/andong-background.png',
  },
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '잠시 후 다시 시도해 주세요.';
}

export default function RegionInfoPage({
  regionId,
  onBack,
  onStartExplore,
}: RegionInfoPageProps) {
  const [selectedRegionId, setSelectedRegionId] =
    useState(regionId);

  const [user, setUser] = useState<ExploreUser | null>(null);
  const [regions, setRegions] = useState<ExploreRegion[]>([]);

  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [message, setMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const pendingMove = useRef<{
    regionId: number;
    key: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    const [userData, regionData] = await Promise.all([
      exploreApi.getUser(),
      exploreApi.getRegions(),
    ]);

    setUser(userData);
    setRegions(regionData.regions);

    return userData;
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setMessage('');

      try {
        const [userData, regionData] = await Promise.all([
          exploreApi.getUser(),
          exploreApi.getRegions(),
        ]);

        if (!active) return;

        setUser(userData);
        setRegions(regionData.regions);
      } catch (error) {
        if (active) {
          setMessage(getErrorMessage(error));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSelectedRegionId(regionId);
  }, [regionId]);

  const region = regions.find(
    (item) => item.id === selectedRegionId,
  );

  const currentRegion = regions.find(
    (item) => item.id === user?.cur_region.id,
  );

  const design =
    regionDesigns[selectedRegionId as 1 | 2] ??
    regionDesigns[2];

  const isCurrent =
    region != null &&
    region.id === user?.cur_region.id;

  const isUnlocked =
    region?.status === 'UNLOCKED';

  const isComplete = isCurrent || isUnlocked;

  const unlock = region?.unlock;

  const requiredPieces =
    unlock?.required_pieces ?? 0;

  const currentPieces =
    unlock?.current_pieces ?? 0;

  const progress =
    requiredPieces > 0
      ? Math.min(
          100,
          (currentPieces / requiredPieces) * 100,
        )
      : 100;

  const requirementName =
    unlock?.specialty_name ?? '사과';

  function handleSelectRegion(id: number) {
    if (moving) return;

    setSelectedRegionId(id);
    setMessage('');
  }

  async function handleMove() {
    if (!region || !user || moving) return;

    if (isCurrent) {
      onStartExplore();
      return;
    }

    if (!isUnlocked) {
      setMessage('아직 해금되지 않은 지역이에요.');
      return;
    }

    const confirmed = window.confirm(
      `${region.name} 지역으로 이동할까요?\n현재 지역의 누적 보상이 정산됩니다.`,
    );

    if (!confirmed) return;

    setMoving(true);
    setMessage('');

    const request =
      pendingMove.current?.regionId === region.id
        ? pendingMove.current
        : {
            regionId: region.id,
            key: crypto.randomUUID(),
          };

    pendingMove.current = request;

    try {
      await exploreApi.moveRegion(
        request.regionId,
        request.key,
      );

      const updatedUser = await loadData();

      if (updatedUser.cur_region.id !== region.id) {
        throw new Error(
          '지역 이동 결과를 확인하지 못했어요.',
        );
      }

      pendingMove.current = null;
      onStartExplore();
    } catch (error) {
      try {
        const latestUser = await exploreApi.getUser();

        if (latestUser.cur_region.id === region.id) {
          pendingMove.current = null;
          onStartExplore();
          return;
        }
      } catch {
        // 서버 응답을 확인하지 못하면 동일 키로 재시도
      }

      setMessage(
        `지역 이동을 확인하지 못했어요. ${getErrorMessage(error)}`,
      );
    } finally {
      setMoving(false);
    }
  }

  if (loading) {
    return (
      <main className="region-info-page">
        <div className="region-info-page__content region-info-page--loading">
          지역 정보를 불러오는 중...
        </div>
      </main>
    );
  }

  if (!region) {
    return (
      <main className="region-info-page">
        <div className="region-info-page__content region-info-page--loading">
          <p>지역 정보를 찾을 수 없어요.</p>

          <button type="button" onClick={onBack}>
            지도로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="region-info-page">
      <div className="region-info-page__content">
        {/* ========================================
            Header
        ======================================== */}

        <header className="region-info-header">
          <div className="region-info-header__profile">
            <img src={profileImage} alt="" />

            <div>
              <strong>Lv.{user?.level ?? 1}</strong>
              <span>{user?.name ?? '원정대원'}</span>
            </div>
          </div>

          <div className="region-info-header__location">
            <span>
              현재 지역 {user?.cur_region.code ?? 'R01'}
            </span>

            <strong>
              <img
                src={
                  user?.cur_region.id === 2
                    ? mackerelImage
                    : appleImage
                }
                alt=""
              />

              {currentRegion?.name ??
                user?.cur_region.name ??
                '청송'}
            </strong>
          </div>

          <div className="region-info-header__gold">
            <img src={goldImage} alt="" />

            <strong>
              {(user?.gold ?? 0).toLocaleString()}
            </strong>
          </div>

          <button
            type="button"
            className="region-info-header__menu"
            aria-label="메뉴 열기"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <img src={menuImage} alt="" />
          </button>
        </header>

        {/* ========================================
            Title
        ======================================== */}

        <div className="region-info-title">
          <h1>지역 정보</h1>
        </div>

        {/* ========================================
            Region Information
        ======================================== */}

        <section
          className="region-info-card"
          aria-label={`${region.name} 지역 정보`}
        >
          <div className="region-info-card__inner">
            {/* 지역 이미지 */}

            <div className="region-info-illustration">
              <img
                className="region-info-illustration__background"
                src={design.background}
                alt={`${region.name} 지역 배경`}
              />

              <div className="region-info-illustration__name">
                <strong>
                  {region.code} {region.name}
                </strong>

                <span>{design.subtitle}</span>
              </div>
              <img
              className="region-info-illustration__lion"
              src="/game/character.png"
              alt="경북 원정대 사자 캐릭터"
              />
              
              <img
                className="region-info-illustration__mackerel"
                src={
                  selectedRegionId === 2
                    ? '/regions/andong-mackerel.png'
                    : appleImage
                }
                alt={design.product}
              />
            </div>

            {/* 해금 조건 */}

            <div className="region-info-requirement">
              <div className="region-info-requirement__top">
                <img
                  src={applePieceImage}
                  alt="사과 조각"
                />

                <div>
                  <small>원정 조건</small>

                  <strong>
                    {selectedRegionId === 1
                      ? '기본 해금 지역'
                      : `${requirementName} 조각 ${requiredPieces}개`}
                  </strong>
                </div>

                <div className="region-info-requirement__rewards">
                  <span>
                    골드/분 {region.gold_per_minute}
                  </span>

                  <span>
                    EXP/분 {region.exp_per_minute}
                  </span>
                </div>
              </div>

              {/* 진행도 */}

              <div className="region-info-progress">
                <span>
                  {selectedRegionId === 1
                    ? '기본 지역'
                    : `현재 보유 ${requirementName} 조각`}
                </span>

                <strong>
                  {selectedRegionId === 1
                    ? '해금 완료'
                    : `${currentPieces}/${requiredPieces}`}
                </strong>

                <div className="region-info-progress__track">
                  <div
                    className="region-info-progress__fill"
                    style={{
                      width: `${
                        selectedRegionId === 1
                          ? 100
                          : progress
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 해금 상태 */}

            <div className="region-info-status">
              <strong>
                {isCurrent
                  ? '✓ 현재 탐험 중!'
                  : isComplete
                    ? '✓ 해금 완료!'
                    : '🔒 해금 조건 미달'}
              </strong>

              <p>
                {isCurrent
                  ? `${region.name} 지역을 탐험하고 있어요!`
                  : isComplete
                    ? `${region.code} ${region.name} 지역이 해금되었습니다!`
                    : `${requirementName} 조각 ${Math.max(
                        0,
                        requiredPieces - currentPieces,
                      )}개를 더 모아야 해요.`}
              </p>
            </div>

            {/* 이동 버튼 */}

            <div className="region-info-actions">
              <button
                type="button"
                className="region-info-actions__back"
                onClick={() => {
                  if (selectedRegionId === 2) {
                    handleSelectRegion(1);
                  } else {
                    onBack();
                  }
                }}
              >
                {selectedRegionId === 2
                  ? '‹ 이전 지역 보기'
                  : '‹ 지도로 돌아가기'}
              </button>

              <button
                type="button"
                className="region-info-actions__move"
                onClick={() => void handleMove()}
                disabled={
                  moving ||
                  (!isCurrent && !isUnlocked)
                }
              >
                {moving
                  ? '이동 중...'
                  : isCurrent
                    ? '탐험하기'
                    : isUnlocked
                      ? '이동하기'
                      : '잠금 상태'}
              </button>
            </div>

            {/* 지역 선택 */}

            <nav
              className="region-info-region-list"
              aria-label="지역 선택"
            >
              <button
                type="button"
                className={
                  selectedRegionId === 1
                    ? 'region-info-region-list__active'
                    : ''
                }
                aria-pressed={selectedRegionId === 1}
                onClick={() => handleSelectRegion(1)}
              >
                <img src={appleImage} alt="" />
                <span>청송</span>
              </button>

              <button
                type="button"
                className={
                  selectedRegionId === 2
                    ? 'region-info-region-list__active'
                    : ''
                }
                aria-pressed={selectedRegionId === 2}
                onClick={() => handleSelectRegion(2)}
              >
                <img src={mackerelImage} alt="" />
                <span>안동</span>
              </button>
            </nav>
          </div>
        </section>

        {/* 알림 */}

        {message && (
          <div className="region-info-notice" role="alert">
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage('')}
              aria-label="알림 닫기"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 기존 게임 메뉴 컴포넌트 */}

      {menuOpen && (
        <GameMenu
          onClose={() => setMenuOpen(false)}
          onOpenMap={() => {
            setMenuOpen(false);
            onBack();
          }}
          onNotice={setMessage}
        />
      )}
    </main>
  );
}
