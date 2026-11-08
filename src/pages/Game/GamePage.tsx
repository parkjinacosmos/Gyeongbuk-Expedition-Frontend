import { useEffect, useRef, useState } from 'react';

import {
  exploreApi,
  type ExploreUser,
  type ExploreRegion,
  type IdleRewardPreview,
  type IdleRewardClaim,
} from '../../api/explore';

import GameHeader from '../../components/GameHeader/GameHeader';
import GameScene from '../../components/GameScene/GameScene';
import GameMenu from '../../components/GameMenu/GameMenu';
import RewardModal from '../../components/RewardModal/RewardModal';

import appleImage from '../../assets/explore/apple.png';
import mackerelImage from '../../assets/explore/mackerel.png';
import goldImage from '../../assets/explore/gold.png';
import treasureIcon from '../../assets/explore/treasure.png';

import './GamePage.css';

interface GamePageProps {
  onOpenMap: () => void;
  onOpenQuiz: () => void;
}

const MAX_SECONDS = 8 * 60 * 60;
const REFRESH_INTERVAL = 15000;

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remaining = safe % 60;

  return [hours, minutes, remaining]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

function errorText(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '잠시 후 다시 시도해 주세요.';
}

export default function GamePage({
  onOpenMap,
  onOpenQuiz,
}: GamePageProps) {
  const [user, setUser] = useState<ExploreUser | null>(null);
  const [regions, setRegions] = useState<ExploreRegion[]>([]);

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
  const mounted = useRef(false);
  const requestVersion = useRef(0);

  // ========================================
  // API Data Loading
  // ========================================

  async function loadData() {
    const version = ++requestVersion.current;

    const [userData, rewardData, regionData] =
      await Promise.all([
        exploreApi.getUser(),
        exploreApi.getIdleReward(),
        exploreApi.getRegions(),
      ]);

    if (
      !mounted.current ||
      version !== requestVersion.current
    ) {
      return;
    }

    const serverTime = Date.parse(rewardData.server_time);

    if (Number.isFinite(serverTime)) {
      serverOffset.current = serverTime - Date.now();
    }

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
      requestVersion.current += 1;
    };
  }, []);

  // ========================================
  // Timer
  // ========================================

  useEffect(() => {
    if (!user) return;

    const update = () => {
      const start = Date.parse(user.last_settled_at);

      if (!Number.isFinite(start)) return;

      const elapsed = Math.floor(
        (Date.now() + serverOffset.current - start) / 1000,
      );

      setSeconds(
        Math.max(0, Math.min(MAX_SECONDS, elapsed)),
      );
    };

    update();

    const timer = window.setInterval(update, 1000);

    return () => window.clearInterval(timer);
  }, [user]);

  // ========================================
  // Reward Preview Refresh
  // ========================================

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    let refreshing = false;

    const timer = window.setInterval(() => {
      if (inFlight.current || refreshing) return;

      refreshing = true;
      const version = requestVersion.current;

      void exploreApi
        .getIdleReward()
        .then((data) => {
          if (
            cancelled ||
            !mounted.current ||
            inFlight.current ||
            version !== requestVersion.current
          ) {
            return;
          }

          const serverTime = Date.parse(data.server_time);

          if (Number.isFinite(serverTime)) {
            serverOffset.current =
              serverTime - Date.now();
          }

          setReward(data);
        })
        .catch(() => {
          // 다음 갱신 주기에 재시도
        })
        .finally(() => {
          refreshing = false;
        });
    }, REFRESH_INTERVAL);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [user]);

  // ========================================
  // Derived Data
  // ========================================

  const currentRegion = regions.find(
    (region) => region.id === user?.cur_region.id,
  );

  const pieces = currentRegion?.specialty.pieces ?? 0;

  const currentRegionImage =
    user?.cur_region.id === 2
      ? mackerelImage
      : appleImage;

  const capSeconds = reward?.cap_seconds || MAX_SECONDS;

  const progress = Math.min(
    100,
    (seconds / capSeconds) * 100,
  );

  const canClaim =
    !!user &&
    !!reward &&
    !loading &&
    !claiming &&
    reward.claimable;

  // ========================================
  // Claim Idle Reward
  // ========================================

  async function handleClaim() {
    if (!canClaim || inFlight.current) return;

    inFlight.current = true;
    setClaiming(true);
    setMessage('');

    const key =
      pendingKey.current ?? crypto.randomUUID();

    pendingKey.current = key;

    try {
      const claim = await exploreApi.claimIdleReward(key);

      requestVersion.current += 1;
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

  // ========================================
  // Render
  // ========================================

  return (
    <main className="game-page">
      <div className="game-page__container">
        {/* 공통 헤더 */}
        <GameHeader
          variant="game"
          user={user}
          regionImage={currentRegionImage}
          regionName={
            user?.cur_region.name ?? '불러오는 중'
          }
          menuOpen={menuOpen}
          onOpenMenu={() =>
            setMenuOpen((prev) => !prev)
          }
          onAddGold={() =>
            setMessage(
              '골드 충전 기능은 준비 중이에요.',
            )
          }
        >
          {/* 게임 화면 전용 배속 버튼 */}
          <button
            className="game-speed-button"
            type="button"
            aria-label={`현재 ${speed}배속, 배속 변경`}
            onClick={() =>
              setSpeed((prev) =>
                prev === 1 ? 2 : 1,
              )
            }
          >
            <span className="game-speed-button__icon">
              ▶
            </span>
            <span>{speed}배속</span>
          </button>
        </GameHeader>

        {/* Game Scene */}
        <section
          className="game-scene"
          aria-label="자동 탐험 게임"
        >
          <GameScene
            speed={speed}
            collectedPieces={pieces}
            regionId={user?.cur_region.id ?? 1}
            specialtyName={currentRegion?.specialty.name}
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
                  style={{ width: `${progress}%` }}
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
              <img src={currentRegionImage} alt="" />
              <strong>
                {reward?.mobs_defeated.toLocaleString() ?? '—'}
              </strong>
              <small>처치한 몬스터</small>
            </div>

            <button
              className="game-rewards__claim"
              type="button"
              disabled={!canClaim}
              onClick={() => void handleClaim()}
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
            explorationSeconds={
              result.gained.elapsed_seconds
            }
            specialtyName={
              result.gained.pieces.name
            }
            dropRateBp={
              result.gained.pieces.drop_rate_bp
            }
            mobsDefeated={
              result.gained.mobs_defeated
            }
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
              onClick={() => setMessage('')}
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
          onClose={() => setMenuOpen(false)}
          onOpenMap={onOpenMap}
          onOpenQuiz={onOpenQuiz}
          onNotice={setMessage}
        />
      )}
    </main>
  );
}
