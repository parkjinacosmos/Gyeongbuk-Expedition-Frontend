import { useEffect, useRef, useState } from 'react';

import {
  exploreApi,
  type ExploreUser,
} from '../../api/explore';

import {
  characterApi,
  CharacterApiError,
  type EquipmentInfo,
} from '../../api/character';

import GameHeader from '../../components/GameHeader/GameHeader';
import GameMenu from '../../components/GameMenu/GameMenu';

import characterImage from '../../assets/character/character.png';
import gogglesImage from '../../assets/character/goggles.png';
import bootsImage from '../../assets/character/boots.png';
import compassImage from '../../assets/character/compass.png';
import backpackImage from '../../assets/character/backpack.png';

import './CharacterPage.css';

// ========================================
// Props
// ========================================

interface CharacterPageProps {
  onOpenMap?: () => void;
  onOpenQuiz?: () => void;
}

// ========================================
// Equipment Images
// ========================================

const equipmentSlots = [
  { name: '탐험 고글', image: gogglesImage },
  { name: '탐험 신발', image: bootsImage },
  { name: '나침반', image: compassImage },
  { name: '탐험 가방', image: backpackImage },
];

// ========================================
// Upgrade Stages
// ========================================

const upgradeStages = [
  { stage: 2, cost: 100, level: 1 },
  { stage: 3, cost: 250, level: 3 },
  { stage: 4, cost: 500, level: 6 },
  { stage: 5, cost: 900, level: 10 },
];

// ========================================
// Helpers
// ========================================

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '알 수 없는 오류가 발생했어요.';
}

function getUpgradeMessage(
  equipment: EquipmentInfo,
): string {
  if (equipment.is_max) {
    return '최고 강화 단계에 도달했어요!';
  }

  if (
    equipment.blocked_by.includes('GOLD') &&
    equipment.blocked_by.includes('LEVEL')
  ) {
    return '골드와 레벨이 부족해요.';
  }

  if (equipment.blocked_by.includes('GOLD')) {
    return '골드가 부족해요.';
  }

  if (equipment.blocked_by.includes('LEVEL')) {
    return '레벨이 부족해요.';
  }

  return '강화할 수 있어요!';
}

// ========================================
// Character Page
// ========================================

export default function CharacterPage({
  onOpenMap,
  onOpenQuiz,
}: CharacterPageProps) {
  const [user, setUser] =
    useState<ExploreUser | null>(null);

  const [equipment, setEquipment] =
    useState<EquipmentInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const pendingKeyRef = useRef<string | null>(null);
  const upgradingRef = useRef(false);

  // ========================================
  // Load Character Data
  // ========================================

  useEffect(() => {
    let cancelled = false;

    async function loadCharacter() {
      try {
        setLoading(true);
        setNotice('');

        const [userData, equipmentData] =
          await Promise.all([
            exploreApi.getUser(),
            characterApi.getEquipment(),
          ]);

        if (cancelled) return;

        setUser(userData);
        setEquipment(equipmentData);
      } catch (error) {
        if (!cancelled) {
          setNotice(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCharacter();

    return () => {
      cancelled = true;
    };
  }, []);

  // ========================================
  // Refresh Data
  // ========================================

  async function refreshCharacter() {
    const [userData, equipmentData] =
      await Promise.all([
        exploreApi.getUser(),
        characterApi.getEquipment(),
      ]);

    setUser(userData);
    setEquipment(equipmentData);
  }

  // ========================================
  // Upgrade Equipment
  // ========================================

  async function handleUpgrade() {
    if (
      upgradingRef.current ||
      !equipment?.can_upgrade ||
      equipment.is_max
    ) {
      return;
    }

    upgradingRef.current = true;
    setUpgrading(true);
    setNotice('');

    const key =
      pendingKeyRef.current ?? crypto.randomUUID();

    pendingKeyRef.current = key;

    try {
      await characterApi.upgradeEquipment(key);

      pendingKeyRef.current = null;

      await refreshCharacter();

      setNotice('장비 강화에 성공했어요!');
    } catch (error) {
      setNotice(getErrorMessage(error));

      if (error instanceof CharacterApiError) {
        pendingKeyRef.current = null;
      }

      try {
        await refreshCharacter();
      } catch {
        // 기존 오류 메시지 유지
      }
    } finally {
      upgradingRef.current = false;
      setUpgrading(false);
    }
  }

  // ========================================
  // Menu
  // ========================================

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

  // ========================================
  // Character Values
  // ========================================

  const currentStage = equipment?.stage ?? 1;

  const exp = user?.exp ?? 0;
  const expMax = user?.exp_to_next_level ?? 0;

  const expPercent =
    expMax > 0
      ? Math.min(100, (exp / expMax) * 100)
      : 0;

  // ========================================
  // Render
  // ========================================

  return (
    <main className="character-page">
      <div className="character-page__content">
        {/* Shared Header */}
        <GameHeader
          user={user}
          variant="character"
          menuOpen={menuOpen}
          onOpenMenu={() => {
            setMenuOpen((prev) => !prev);
          }}
          onAddGold={() => {
            setNotice('골드 충전 기능은 준비 중이에요.');
          }}
        />

        {/* Title */}
        <div className="character-page__title">
          캐릭터
        </div>

        {loading ? (
          <div className="character-page__loading">
            캐릭터 정보를 불러오는 중이에요...
          </div>
        ) : (
          <>
            {/* Character Information */}
            <section className="character-page__hero">
              <div className="character-page__illustration">
                <img
                  src={characterImage}
                  alt="탐험가 캐릭터"
                  className="character-page__character-image"
                />
              </div>

              <div className="character-page__stats">
                <strong className="character-page__level">
                  Lv.{user?.level ?? '-'} 새싹 원정대원
                </strong>

                <div className="character-page__exp-label">
                  EXP {exp}/{expMax}
                </div>

                <div className="character-page__exp-track">
                  <div
                    className="character-page__exp-fill"
                    style={{
                      width: `${expPercent}%`,
                    }}
                  />
                </div>

                <div className="character-page__bonus">
                  <span>레벨 보너스</span>
                  <strong>
                    +{user?.level_gold_bonus_percent ?? 0}%
                  </strong>
                </div>

                <div className="character-page__bonus">
                  <span>장비 보너스</span>
                  <strong>
                    +{equipment?.gold_bonus_percent ?? 0}%
                  </strong>
                </div>
              </div>
            </section>

            {/* Equipment Slots */}
            <section
              className="character-page__slots"
              aria-label="탐험 장비"
            >
              {equipmentSlots.map((slot) => (
                <div
                  className="character-page__slot"
                  key={slot.name}
                >
                  <img
                    src={slot.image}
                    alt=""
                    className="character-page__slot-image"
                  />
                  <strong>{slot.name}</strong>
                </div>
              ))}
            </section>

            {/* Equipment Upgrade */}
            <section className="character-page__upgrade">
              <div className="character-page__upgrade-heading">
                <h2>장비 강화</h2>
                <span>강화 성공률 100%</span>
              </div>

              <p className="character-page__upgrade-desc">
                장비 단계가 오를 때마다
                골드 보너스 +10%p
              </p>

              <div className="character-page__stage-track">
                {[1, 2, 3, 4, 5].map((stage) => (
                  <div
                    key={stage}
                    className={
                      'character-page__stage ' +
                      (stage <= currentStage
                        ? 'is-active'
                        : '')
                    }
                  >
                    {stage}
                  </div>
                ))}
              </div>

              <div className="character-page__stage-cards">
                {upgradeStages.map((item) => {
                  const isNext =
                    currentStage + 1 === item.stage;

                  const cost =
                    isNext && equipment?.next
                      ? equipment.next.upgrade_cost
                      : item.cost;

                  const requiredLevel =
                    isNext && equipment?.next
                      ? equipment.next.required_level
                      : item.level;

                  return (
                    <div
                      key={item.stage}
                      className={
                        'character-page__stage-card ' +
                        (isNext ? 'is-next' : '')
                      }
                    >
                      <strong>
                        {item.stage - 1} → {item.stage}
                      </strong>
                      <span>{cost}골드</span>
                      <small>Lv.{requiredLevel}</small>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="character-page__upgrade-button"
                disabled={
                  upgrading ||
                  !equipment?.can_upgrade ||
                  equipment.is_max
                }
                onClick={() => void handleUpgrade()}
              >
                {upgrading
                  ? '강화 중...'
                  : equipment?.is_max
                    ? '최고 단계 달성'
                    : '강화하기'}
              </button>

              {equipment && (
                <p className="character-page__upgrade-message">
                  {getUpgradeMessage(equipment)}
                </p>
              )}
            </section>
          </>
        )}

        {notice && (
          <p
            className="character-page__notice"
            role="status"
          >
            {notice}
          </p>
        )}
      </div>

      {/* Shared Game Menu */}
      {menuOpen && (
        <GameMenu
          onClose={() => setMenuOpen(false)}
          onOpenMap={handleOpenMap}
          onNotice={setNotice}
          onOpenQuiz={handleOpenQuiz}
        />
      )}
    </main>
  );
}
