import { useEffect, useRef, useState } from 'react';

import {
  exploreApi,
  type ExploreUser,
  type ExploreRegion,
  type IdleRewardPreview,
  type IdleRewardClaim,
} from '../../api/explore';

import GameScene from '../../components/GameScene/GameScene';
import GameMenu from '../../components/GameMenu/GameMenu';
import RewardModal from '../../components/RewardModal/RewardModal';

import appleImage from '../../assets/explore/apple.png';
import goldImage from '../../assets/explore/gold.png';
import profileImage from '../../assets/explore/profile.png';
import menuImage from '../../assets/explore/menu.png';
import treasureIcon from '../../assets/explore/treasure.png';

import './GamePage.css';

interface GamePageProps {
  onOpenMap: () => void;
}

const MAX_SECONDS = 8 * 60 * 60;

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(remainingSeconds).padStart(2, '0'),
  ].join(':');
}

function errorText(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '잠시 후 다시 시도해 주세요.';
}

export default function GamePage({
  onOpenMap,
}: GamePageProps) {
  const [user, setUser] =
    useState<ExploreUser | null>(null);

  const [regions, setRegions] =
    useState<ExploreRegion[]>([]);

  const [reward, setReward] =
    useState<IdleRewardPreview | null>(null);

  const [seconds, setSeconds] = useState(0);

  const [speed, setSpeed] = useState<1 | 2>(1);
  const [menuOpen, setMenuOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const [result, setResult] =
    useState<IdleRewardClaim | null>(null);

  const [message, setMessage] = useState('');

  const serverOffset = useRef(0);
  const pendingKey = useRef<string | null>(null);
  const inFlight = useRef(false);
  const mounted = useRef(true);

  async function loadData() {
    const [userData, rewardData, regionData] =
      await Promise.all([
        exploreApi.getUser(),
        exploreApi.getIdleReward(),
        exploreApi.getRegions(),
      ]);

    if (!mounted.current) return;

    serverOffset.current =
      Date.parse(rewardData.server_time) -
      Date.now();

    setUser(userData);
    setReward(rewardData);
    setRegions(regionData.regions);
  }

  useEffect(() => {
    mounted.current = true;

    void loadData()
      .catch((error: unknown) => {
        if (!mounted.current) return;

        setMessage(
          `정보를 불러오지 못했어요. ${errorText(error)}`,
        );
      })
      .finally(() => {
        if (mounted.current) {
          setLoading(false);
        }
      });

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const update = () => {
      const start = Date.parse(user.last_settled_at);

      if (!Number.isFinite(start)) return;

      const elapsed = Math.floor(
        (Date.now() +
          serverOffset.current -
          start) /
          1000,
      );

      setSeconds(
        Math.max(0, Math.min(MAX_SECONDS, elapsed)),
      );
    };

    update();

    const timer = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const timer = window.setInterval(() => {
      if (inFlight.current) return;

      void exploreApi
        .getIdleReward()
        .then((data) => {
          if (!mounted.current) return;

          serverOffset.current =
            Date.parse(data.server_time) -
            Date.now();

          setReward(data);
        })
        .catch(() => {
          // 다음 갱신에서 재시도
        });
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [user]);

  const currentRegion = regions.find(
    (region) => region.id === user?.cur_region.id,
  );

  const pieces =
    currentRegion?.specialty.pieces ?? 0;

  const progress = Math.min(
    100,
    (seconds /
      (reward?.cap_seconds || MAX_SECONDS)) *
      100,
  );

  const canClaim =
    !!user &&
    !!reward &&
    !loading &&
    !claiming &&
    seconds >= 60 &&
    reward.claimable;

  async function handleClaim() {
    if (!canClaim || inFlight.current) return;

    inFlight.current = true;
    setClaiming(true);
    setMessage('');

    const key =
      pendingKey.current ?? crypto.randomUUID();

    pendingKey.current = key;

    try {
      const claim =
        await exploreApi.claimIdleReward(key);

      pendingKey.current = null;

      if (!mounted.current) return;

      setResult(claim);

      try {
        await loadData();
      } catch {
        if (mounted.current) {
          setMessage(
            '보상은 수령했지만 최신 정보를 불러오지 못했어요. 새로고침해 주세요.',
          );
        }
      }
    } catch (error: unknown) {
      if (mounted.current) {
        setMessage(
          `보상 수령에 실패했어요. ${errorText(error)}`,
        );
      }
    } finally {
      inFlight.current = false;

      if (mounted.current) {
        setClaiming(false);
      }
    }
  }

  return (
    <main className="game-page">
      <div className="game-page__container">
        {/* Header */}
        <header className="game-header">
          <div className="game-header__profile">
            <img src={profileImage} alt="" />

            <div>
              <strong>
                Lv.{user?.level ?? '—'}
              </strong>

              <span>
                {user?.name ?? '원정대원'}
              </span>
            </div>
          </div>

          <div className="game-header__region">
            <span>
              현재 지역{' '}
              {user?.cur_region.code ?? '—'}
            </span>

            <strong>
              <img src={appleImage} alt="" />

              {user?.cur_region.name ??
                '불러오는 중'}
            </strong>
          </div>

          <div className="game-header__gold">
            <img src={goldImage} alt="" />

            <strong>
              {user?.gold.toLocaleString() ?? '—'}
            </strong>
          </div>

          {/* 배속 버튼 */}
          <button
            className="game-speed-button"
            type="button"
            aria-label={`현재 ${speed}배속, 배속 변경`}
            onClick={() => {
              setSpeed((prev) =>
                prev === 1 ? 2 : 1,
              );
            }}
          >
            <span className="game-speed-button__icon">
              ▶
            </span>

            <span>{speed}배속</span>
          </button>

          {/* 메뉴 버튼 */}
          <button
            className="game-header__menu"
            type="button"
            aria-label="메뉴"
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((prev) => !prev);
            }}
          >
            <img src={menuImage} alt="" />
          </button>
        </header>

        {/* Game Scene */}
        <section
          className="game-scene"
          aria-label="자동 탐험 게임"
        >
          <GameScene
            speed={speed}
            collectedPieces={pieces}
          />
        </section>

        {/* Idle Reward */}
        <section className="game-rewards">
          <div className="game-rewards__header">
            <div className="game-rewards__title">
              <img
                src={treasureIcon}
                alt=""
                className="game-rewards__treasure"
              />
              <h2>쌓인 보상</h2>
            </div>

            <div className="game-rewards__timer">
              <div className="game-rewards__time">
                <span>
                  {formatTime(seconds)}
                  {' / 최대 8시간'}
                </span>
              </div>

              <div className="game-rewards__track">
                <div
                  className="game-rewards__progress"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="game-rewards__bottom">
            <div className="game-rewards__item">
              <img src={goldImage} alt="" />

              <strong>
                {reward?.gold.toLocaleString() ?? '—'}
              </strong>

              <small>예상 골드</small>
            </div>

            <div className="game-rewards__item">
              <img src="/game/exp.png" alt="" />

              <strong>
                {reward?.exp.toLocaleString() ?? '—'}
              </strong>

              <small>예상 경험치</small>
            </div>

            <div className="game-rewards__item">
              <img src={appleImage} alt="" />

              <strong>
                {reward
                  ? `${reward.piece_judgments}회`
                  : '—'}
              </strong>

              <small>조각 추첨</small>
            </div>

            <button
              className="game-rewards__claim"
              type="button"
              disabled={!canClaim}
              onClick={() => {
                void handleClaim();
              }}
            >
              {claiming
                ? '수령 중...'
                : loading
                  ? '로딩 중'
                  : canClaim
                    ? '보상 수령'
                    : '탐험 중'}
            </button>
          </div>
        </section>

        {/* Claim Result */}
       
{result && (
  <RewardModal
    gold={result.gained.gold}
    exp={result.gained.exp}
    pieces={result.gained.pieces.gained}
    totalGold={result.gold}
    currentExp={result.exp}
    totalPieces={result.gained.pieces.total}
    explorationSeconds={result.gained.elapsed_seconds}
    specialtyName={result.gained.pieces.name}
    onClose={() => {
  setResult(null);
  onOpenMap();
}}
onContinue={() => setResult(null)}
  />
)}

        {/* Notice */}
        {message && (
          <div
            className="game-notice"
            role="status"
          >
            {message}

            <button
              type="button"
              onClick={() => {
                setMessage('');
              }}
              aria-label="알림 닫기"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Game Menu */}
      {menuOpen && (
        <GameMenu
          onClose={() => {
            setMenuOpen(false);
          }}
          onOpenMap={() => {
            setMenuOpen(false);
            onOpenMap();
          }}
          onNotice={setMessage}
        />
      )}
    </main>
  );
}
