import { useEffect, useRef, useState } from 'react';

import {
  exploreApi,
  type ExploreRegion,
  type ExploreUser,
} from '../../api/explore';

import GameMenu from '../../components/GameMenu/GameMenu';

import applePieceImage from '../../assets/explore/apple-piece.png';
import goldImage from '../../assets/explore/gold.png';
import profileImage from '../../assets/explore/profile.png';
import menuImage from '../../assets/explore/menu.png';

import { getRegionDesign } from '../../regions';
import { regionBackgroundImage } from '../Game/regionBackgrounds';
import './RegionInfoPage.css';

// ========================================
// Types
// ========================================

interface RegionInfoPageProps {
  regionId: number;
  onSelectRegion: (regionId: number) => void;
  onBack: () => void;
  onStartExplore: () => void;
  onOpenQuiz: () => void;
}

interface PendingMove {
  regionId: number;
  key: string;
}

// ========================================
// Region Design Data
// ========================================

const regionIllustrations: Partial<Record<number, { subtitle: string; background: string }>> = {
  1: {
    subtitle: '청송 사과 농장',
    background: '/game/background.png',
  },
  2: {
    subtitle: '간고등어 나루터',
    background: '/regions/andong-background.png',
  },
};

// ========================================
// Helpers
// ========================================

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '잠시 후 다시 시도해 주세요.';
}

// ========================================
// Region Info Page
// ========================================

export default function RegionInfoPage({
  regionId: selectedRegionId,
  onSelectRegion,
  onBack,
  onStartExplore,
  onOpenQuiz,
}: RegionInfoPageProps) {
  const [user, setUser] =
    useState<ExploreUser | null>(null);

  const [regions, setRegions] =
    useState<ExploreRegion[]>([]);

  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [message, setMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // 동일 지역 이동 요청 재시도 시 키 재사용
  const pendingMove = useRef<PendingMove | null>(null);

  // 중복 클릭 즉시 차단
  const movingRef = useRef(false);

  // ========================================
  // Load User & Regions
  // ========================================

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setMessage('');

      try {
        const [userData, regionData] =
          await Promise.all([
            exploreApi.getUser(),
            exploreApi.getRegions(),
          ]);

        if (!active) return;

        setUser(userData);
        setRegions(regionData.regions);
      } catch (error) {
        if (!active) return;

        setMessage(
          `지역 정보를 불러오지 못했어요. ${getErrorMessage(error)}`,
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  // ========================================
  // Region Data
  // ========================================

  const region = regions.find(
    (item) => item.id === selectedRegionId,
  );

  const currentRegion = regions.find(
    (item) => item.id === user?.cur_region.id,
  );

  const design = getRegionDesign(selectedRegionId);
  const illustration = regionIllustrations[selectedRegionId];
  const previousRegion = regions.find((item) => item.id === region?.unlock?.region_id);

  const isCurrent =
    region != null &&
    region.id === user?.cur_region.id;

  const isUnlocked =
    region?.status === 'UNLOCKED';

  const isComplete = isCurrent || isUnlocked;

  // 백엔드의 해금 조건
  const unlock = region?.unlock;

  const requiredPieces =
    unlock?.required_pieces ?? 0;

  const currentPieces =
    unlock?.current_pieces ?? 0;

  const requirementName =
    unlock?.specialty_name ?? '사과';
  const requirementImage = unlock && unlock.region_id !== 1
    ? getRegionDesign(unlock.region_id).image
    : applePieceImage;

  // 해금된 지역은 100%, 잠긴 지역은 실제 진행도
  const progress = isComplete
    ? 100
    : requiredPieces > 0
      ? Math.min(
          100,
          (currentPieces / requiredPieces) * 100,
        )
      : 0;

  const progressText =
    selectedRegionId === 1 || isComplete
      ? '해금 완료'
      : requiredPieces > 0
        ? `${currentPieces}/${requiredPieces}`
        : '조건 확인 중';

  // ========================================
  // Select Region
  // ========================================

  function handleSelectRegion(id: number) {
    if (movingRef.current) return;

    if (id === selectedRegionId) return;

    pendingMove.current = null;

    onSelectRegion(id);
    setMessage('');
  }

  // ========================================
  // Move Region API
  // ========================================

  async function handleMove() {
    if (!region || !user || movingRef.current) {
      return;
    }

    // 현재 지역이면 게임 화면으로 이동
    if (isCurrent) {
      onStartExplore();
      return;
    }

    // 백엔드 해금 상태 확인
    if (!isUnlocked) {
      setMessage('아직 해금되지 않은 지역이에요.');
      return;
    }

    const targetRegionId = region.id;

    const confirmed = window.confirm(
      `${region.name} 지역으로 이동할까요?\n현재 지역의 누적 보상이 정산됩니다.`,
    );

    if (!confirmed) return;

    movingRef.current = true;
    setMoving(true);
    setMessage('');

    // 같은 이동 요청을 재시도할 때는 동일한 키 사용
    const request: PendingMove =
      pendingMove.current?.regionId === targetRegionId
        ? pendingMove.current
        : {
            regionId: targetRegionId,
            key: crypto.randomUUID(),
          };

    pendingMove.current = request;

    try {
      // 실제 백엔드에 지역 이동 요청
      await exploreApi.moveRegion(
        request.regionId,
        request.key,
      );

      // 이동 결과를 사용자 정보로 재확인
      const updatedUser = await exploreApi.getUser();

      if (
        updatedUser.cur_region.id !== request.regionId
      ) {
        throw new Error(
          '지역 이동 결과를 확인하지 못했어요.',
        );
      }

      setUser(updatedUser);
      pendingMove.current = null;

      onStartExplore();
    } catch (error) {
      // 요청은 성공했지만 응답을 받지 못한 경우 확인
      try {
        const latestUser = await exploreApi.getUser();

        setUser(latestUser);

        if (
          latestUser.cur_region.id === targetRegionId
        ) {
          pendingMove.current = null;
          onStartExplore();
          return;
        }
      } catch {
        // 서버 상태를 확인하지 못하면
        // 동일한 Idempotency-Key로 재시도 가능
      }

      setMessage(
        `지역 이동을 확인하지 못했어요. ${getErrorMessage(error)}`,
      );
    } finally {
      movingRef.current = false;
      setMoving(false);
    }
  }

  // ========================================
  // Loading
  // ========================================

  if (loading) {
    return (
      <main className="region-info-page">
        <div className="region-info-page__content region-info-page--loading">
          지역 정보를 불러오는 중...
        </div>
      </main>
    );
  }

  // ========================================
  // Region Not Found
  // ========================================

  if (!region) {
    return (
      <main className="region-info-page">
        <div className="region-info-page__content region-info-page--loading">
          <p>
            {message || '지역 정보를 찾을 수 없어요.'}
          </p>

          <button
            type="button"
            onClick={onBack}
          >
            지도로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  // ========================================
  // Render
  // ========================================

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
              <strong>
                Lv.{user?.level ?? 1}
              </strong>

              <span>
                {user?.name ?? '원정대원'}
              </span>
            </div>
          </div>

          <div className="region-info-header__location">
            <span>
              현재 지역{' '}
              {user?.cur_region.code ?? 'R01'}
            </span>

            <strong>
              <img
                src={getRegionDesign(user?.cur_region.id ?? 1).image}
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
            onClick={() =>
              setMenuOpen((prev) => !prev)
            }
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
                src={illustration?.background ?? regionBackgroundImage(region.id)}
                alt={`${region.name} 지역 배경`}
              />

              <div className="region-info-illustration__name">
                <strong>
                  {region.code} {region.name}
                </strong>

                <span>{illustration?.subtitle ?? region.specialty.name}</span>
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
                    : design.image
                }
                alt={region.specialty.name}
              />
            </div>

            {/* ========================================
                해금 조건
            ======================================== */}

            <div className="region-info-requirement">
              <div className="region-info-requirement__top">
                <img
                  src={requirementImage}
                  alt={`${requirementName} 조각`}
                />

                <div>
                  <small>원정 조건</small>

                  <strong>
                    {selectedRegionId === 1
                      ? '기본 해금 지역'
                      : isComplete
                        ? '해금 완료'
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
                    : isComplete
                      ? '해금된 지역'
                      : `현재 보유 ${requirementName} 조각`}
                </span>

                <strong>{progressText}</strong>

                <div className="region-info-progress__track">
                  <div
                    className="region-info-progress__fill"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ========================================
                해금 상태
            ======================================== */}

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
                    : requiredPieces > 0
                      ? `${requirementName} 조각 ${Math.max(
                          0,
                          requiredPieces - currentPieces,
                        )}개를 더 모아야 해요.`
                      : '해금 조건을 확인해 주세요.'}
              </p>
            </div>

            {/* ========================================
                이동 버튼
            ======================================== */}

            <div className="region-info-actions">
              <button
                type="button"
                className="region-info-actions__back"
                onClick={() => {
                  if (previousRegion) {
                    handleSelectRegion(previousRegion.id);
                  } else {
                    onBack();
                  }
                }}
                disabled={moving}
              >
                {previousRegion
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

            {/* ========================================
                지역 선택
            ======================================== */}

            <nav
              className="region-info-region-list"
              aria-label="지역 선택"
            >
              {regions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === selectedRegionId ? 'region-info-region-list__active' : ''}
                  aria-pressed={item.id === selectedRegionId}
                  onClick={() => handleSelectRegion(item.id)}
                  disabled={moving}
                >
                  <img src={getRegionDesign(item.id).image} alt="" />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </section>

        {/* ========================================
            Notice
        ======================================== */}

        {message && (
          <div
            className="region-info-notice"
            role="alert"
          >
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

      {/* ========================================
          Shared Game Menu
      ======================================== */}

      {menuOpen && (
        <GameMenu
          onClose={() =>
            setMenuOpen(false)
          }
          onOpenMap={() => {
            setMenuOpen(false);
            onBack();
          }}
          onNotice={setMessage}
          onOpenQuiz={onOpenQuiz}
        />
      )}
    </main>
  );
}
