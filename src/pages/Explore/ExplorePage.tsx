import { useEffect, useState } from 'react';

import {
  exploreApi,
  type ExploreRegion,
  type ExploreUser,
} from '../../api/explore';

import GameMenu from '../../components/GameMenu/GameMenu';

import appleImage from '../../assets/explore/apple.png';
import mackerelImage from '../../assets/explore/mackerel.png';
import ginsengImage from '../../assets/explore/ginseng.png';
import omijaImage from '../../assets/explore/omija.png';
import persimmonImage from '../../assets/explore/persimmon.png';
import melonImage from '../../assets/explore/melon.png';
import garlicImage from '../../assets/explore/garlic.png';
import gwamegiImage from '../../assets/explore/gwamegi.png';

import goldImage from '../../assets/explore/gold.png';
import lockImage from '../../assets/explore/lock.png';
import mapBackground from '../../assets/explore/map-background.png';
import mapIcon from '../../assets/explore/map-icon.png';
import menuImage from '../../assets/explore/menu.png';
import plusImage from '../../assets/explore/plus.png';
import profileImage from '../../assets/explore/profile.png';

import './ExplorePage.css';

interface ExplorePageProps {
  onStartExplore: () => void;
  onOpenRegionInfo: (regionId: number) => void;
  onOpenQuiz: () => void;
}

interface RegionDesign {
  id: number;
  name: string;
  product: string;
  image: string;
  x: number;
  y: number;
}

interface DisplayRegion extends RegionDesign {
  apiData: ExploreRegion | null;
  status: 'current' | 'unlocked' | 'locked';
  requirement: string;
}

const regionDesigns: RegionDesign[] = [
  {
    id: 1,
    name: '청송',
    product: '사과',
    image: appleImage,
    x: 60,
    y: 8,
  },
  {
    id: 2,
    name: '안동',
    product: '간고등어',
    image: mackerelImage,
    x: 208,
    y: 8,
  },
  {
    id: 3,
    name: '영주',
    product: '풍기인삼',
    image: ginsengImage,
    x: 255,
    y: 116,
  },
  {
    id: 4,
    name: '문경',
    product: '오미자',
    image: omijaImage,
    x: 116,
    y: 116,
  },
  {
    id: 5,
    name: '상주',
    product: '곶감',
    image: persimmonImage,
    x: 61,
    y: 224,
  },
  {
    id: 6,
    name: '성주',
    product: '참외',
    image: melonImage,
    x: 204,
    y: 224,
  },
  {
    id: 7,
    name: '의성',
    product: '마늘',
    image: garlicImage,
    x: 81,
    y: 332,
  },
  {
    id: 8,
    name: '포항',
    product: '과메기',
    image: gwamegiImage,
    x: 219,
    y: 332,
  },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '알 수 없는 오류가 발생했어요.';
}

export default function ExplorePage({
  onStartExplore,
  onOpenRegionInfo,
  onOpenQuiz,
}: ExplorePageProps) {
  const [user, setUser] =
    useState<ExploreUser | null>(null);

  const [apiRegions, setApiRegions] =
    useState<ExploreRegion[]>([]);

  const [selectedId, setSelectedId] = useState(1);

  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // ========================================
  // API 데이터 불러오기
  // ========================================

  useEffect(() => {
    let cancelled = false;

    async function loadExploreData() {
      try {
        setLoading(true);
        setNotice('');

        const [userData, regionData] =
          await Promise.all([
            exploreApi.getUser(),
            exploreApi.getRegions(),
          ]);

        if (cancelled) return;

        setUser(userData);
        setApiRegions(regionData.regions);

        const currentId = userData.cur_region.id;

        setSelectedId(
          regionDesigns.some(
            (region) => region.id === currentId,
          )
            ? currentId
            : 1,
        );
      } catch (error) {
        if (cancelled) return;

        setNotice(
          `탐험 정보를 불러오지 못했어요. ${getErrorMessage(error)}`,
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadExploreData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ========================================
  // API 데이터와 디자인 결합
  // ========================================

  const regions: DisplayRegion[] =
    regionDesigns.map((design) => {
      const apiData =
        apiRegions.find(
          (region) => region.id === design.id,
        ) ?? null;

      const isCurrent =
        user?.cur_region.id === design.id;

      let status: DisplayRegion['status'] = 'locked';
      let requirement = '잠긴 지역';

      if (isCurrent) {
        status = 'current';
        requirement = '현재 지역';
      } else if (apiData?.status === 'UNLOCKED') {
        status = 'unlocked';
        requirement = '해금 완료';
      } else if (apiData?.status === 'LOCKED') {
        status = 'locked';

        if (apiData.unlock) {
          const {
            specialty_name,
            current_pieces,
            required_pieces,
          } = apiData.unlock;

          requirement =
            `${specialty_name} 조각 ` +
            `${current_pieces}/${required_pieces}개`;
        }
      }

      return {
        ...design,
        apiData,
        status,
        requirement,
      };
    });

  const currentId = user?.cur_region.id ?? 1;

  const currentRegion =
    regions.find(
      (region) => region.id === currentId,
    ) ?? regions[0];

  const selectedRegion =
    regions.find(
      (region) => region.id === selectedId,
    ) ?? currentRegion;

  const isCurrent =
    selectedRegion.id === currentId;

  const isLocked =
    selectedRegion.status === 'locked';

  // ========================================
  // 지역 선택
  // ========================================

  function handleRegionSelect() {
    if (loading || !user) return;

    const regionId = selectedRegion.id;

    if (regionId !== 1 && regionId !== 2) {
      setNotice(
        'MVP에서 아직 지원하지 않는 지역이에요.',
      );
      return;
    }

    setNotice('');

    // 현재 지역은 기존 게임 화면으로 이동
    if (isCurrent) {
      onStartExplore();
      return;
    }

    // 다른 지역은 잠금 여부와 관계없이
    // 지역 정보 화면에서 조건을 확인
    onOpenRegionInfo(regionId);
  }

  // ========================================
  // Render
  // ========================================

  return (
    <main className="explore-page">
      <div className="explore-page__content">
        {/* 배경 */}

        <img
          className="explore-page__background"
          src={mapBackground}
          alt=""
        />

        {/* 상단 정보 */}

        <header className="explore-header">
          <div className="explore-header__profile">
            <img src={profileImage} alt="" />

            <div>
              <strong>
                Lv.{user?.level ?? 1}
              </strong>

              <span>새싹 원정대원</span>
            </div>
          </div>

          <div className="explore-header__location">
            <span>
              현재 지역{' '}
              {user?.cur_region.code ?? 'R01'}
            </span>

            <strong>
              <img
                src={currentRegion.image}
                alt=""
              />

              {currentRegion.name}{' '}
              {currentRegion.product}
            </strong>

            <small>
              경북 원정대 탐험 중
            </small>
          </div>

          <div className="explore-header__gold">
            <img
              src={goldImage}
              alt=""
            />

            <strong>
              {(user?.gold ?? 0).toLocaleString()}
            </strong>

            <button
              type="button"
              aria-label="골드 추가"
              onClick={() =>
                setNotice(
                  '골드 충전 기능은 준비 중이에요.',
                )
              }
            >
              <img
                src={plusImage}
                alt=""
              />
            </button>
          </div>

          <button
            type="button"
            className="explore-header__menu"
            aria-label="메뉴 열기"
            aria-expanded={menuOpen}
            onClick={() =>
              setMenuOpen((prev) => !prev)
            }
          >
            <img
              src={menuImage}
              alt=""
            />
          </button>
        </header>

        {/* 탐험 지도 제목 */}

        <div className="explore-title">
          <div className="explore-title__inner" />

          <img
            src={mapIcon}
            alt=""
          />

          <h1>탐험 지도</h1>
        </div>

        {/* 탐험 지도 */}

        <section
          className="explore-map"
          aria-label="경북 탐험 지도"
          aria-busy={loading}
        >
          <svg
            className="explore-map__route"
            viewBox="0 0 402 432"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M123 55 C175 37 270 48 273 100"
              fill="none"
              stroke="#f1de60"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="2 14"
            />
          </svg>

          {regions.map((region) => {
            const active =
              region.id === currentId;

            const selected =
              region.id === selectedId;

            const locked =
              region.status === 'locked';

            return (
              <button
                key={region.id}
                type="button"
                className={[
                  'explore-region',
                  active &&
                    'explore-region--current',
                  selected &&
                    'explore-region--selected',
                  locked &&
                    'explore-region--locked',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  left: `${
                    (region.x / 402) * 100
                  }%`,
                  top: `${region.y}px`,
                }}
                onClick={() => {
                  setSelectedId(region.id);
                  setNotice('');
                }}
                aria-pressed={selected}
                aria-label={
                  `${region.name} ${region.product}, ` +
                  region.requirement
                }
              >
                <span className="explore-region__code">
                  R
                  {String(region.id).padStart(
                    2,
                    '0',
                  )}
                </span>

                <img
                  className="explore-region__icon"
                  src={region.image}
                  alt=""
                />

                <strong className="explore-region__name">
                  {region.name}{' '}
                  {region.product}
                </strong>

                <span className="explore-region__status">
                  {active
                    ? '현재 지역'
                    : locked
                      ? region.requirement
                      : '✓ 해금 완료'}
                </span>

                {locked && (
                  <img
                    className="explore-region__lock"
                    src={lockImage}
                    alt=""
                  />
                )}
              </button>
            );
          })}
        </section>

        {/* 선택 지역 정보 */}

        <section
          className="explore-detail"
          aria-label="선택 지역 정보"
        >
          <div className="explore-detail__inner" />

          <img
            className="explore-detail__icon"
            src={selectedRegion.image}
            alt=""
          />

          <div className="explore-detail__info">
            <h2>
              {selectedRegion.name} ·{' '}
              {selectedRegion.product}
            </h2>

            <p>
              {isLocked
                ? selectedRegion.requirement
                : selectedRegion.apiData
                  ? `골드/분 ${selectedRegion.apiData.gold_per_minute} · EXP/분 ${selectedRegion.apiData.exp_per_minute}`
                  : '지역 정보를 불러오는 중'}
            </p>
          </div>

          <div className="explore-detail__actions">
            <span>
              {isCurrent
                ? '현재 탐험 중'
                : isLocked
                  ? '해금 조건 확인'
                  : '해금 완료'}
            </span>

            <button
              type="button"
              onClick={handleRegionSelect}
              disabled={loading || !user}
            >
              {isCurrent
                ? '탐험 입장 ›'
                : '지역 정보 보기 ›'}
            </button>
          </div>
        </section>

        {/* 알림 */}

        {notice && (
          <div
            className="explore-notice"
            role="status"
          >
            <span>{notice}</span>

            <button
              type="button"
              onClick={() => setNotice('')}
              aria-label="알림 닫기"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 공통 게임 메뉴 */}

      {menuOpen && (
        <GameMenu
          onClose={() =>
            setMenuOpen(false)
          }
          onOpenMap={() =>
            setMenuOpen(false)
          }
          onNotice={setNotice}
          onOpenQuiz={onOpenQuiz}
        />
      )}
    </main>
  );
}
