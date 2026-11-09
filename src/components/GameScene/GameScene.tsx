import { useEffect, useRef, useState } from 'react';

import { preload } from 'react-dom';

import './GameScene.css';

interface GameSceneProps {
  speed: 1 | 2;
  collectedPieces: number;
  onTravel: (elapsedAtSpeed: number) => void;
  regionId?: number;
  specialtyName?: string;
}

const LION_FRAMES = {
  ready: '/game/combat/lion-ready.png',
  step: '/game/combat/lion-step.png',
  strike: '/game/combat/lion-strike.png',
  recover: '/game/combat/lion-recover.png',
} as const;

const APPLE_FRAMES = [
  { idle: '/game/apple.png', hit: '/game/combat/apple-hit.png' },
  { idle: '/game/apple-alt.png', hit: '/game/combat/apple-alt-hit.png' },
] as const;

const MONSTER_KIND_BY_REGION: Readonly<Partial<Record<number, string>>> = {
  2: 'mackerel',
  3: 'ginseng',
  4: 'omija',
  5: 'persimmon',
  6: 'melon',
  7: 'garlic',
  8: 'gwamegi',
};


function monsterFrames(kind: string | undefined, isSmall: boolean) {
  if (!kind) return APPLE_FRAMES[isSmall ? 1 : 0];

  const size = isSmall ? 'small' : 'large';
  const base = '/game/combat/monsters/' + kind + '-' + size;
  return { idle: base + '-idle.png', hit: base + '-hit.png' };
}

type LionPose = keyof typeof LION_FRAMES;

interface Monster {
  id: number;
  hp: number;
  damage: number;
  pose: 'idle' | 'hit' | 'dying';
}

interface CombatFrame {
  lionPose: LionPose;
  monster: Monster | null;
}

const SPAWN_INTERVAL = 4000;
const TRAVEL_RAMP_DURATION = 160;
const MAX_HP = 100;
const STRIKE_DAMAGE = MAX_HP; // 기존 충돌은 한 번에 몬스터를 처치했다.

const APPROACH_AT = 160;
const PREPARE_AT = 345;
const LUNGE_AT = 435;
const STRIKE_AT = 505;
const RECOVER_AT = 640;
const RETURN_AT = 745;
const CYCLE_DURATION = 1000;
const HIT_DURATION = 200;
const DEATH_DURATION = 450;
const APPROACH_DISTANCE = 0.86;

function ease(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function lionMotion(time: number): { pose: LionPose; advance: number } {
  if (time < APPROACH_AT || time >= CYCLE_DURATION) {
    return { pose: 'ready', advance: 0 };
  }

  if (time < PREPARE_AT) {
    const progress = (time - APPROACH_AT) / (PREPARE_AT - APPROACH_AT);
    return { pose: 'step', advance: APPROACH_DISTANCE * ease(progress) };
  }

  if (time < LUNGE_AT) {
    return { pose: 'ready', advance: APPROACH_DISTANCE };
  }

  if (time < STRIKE_AT) {
    const progress = (time - LUNGE_AT) / (STRIKE_AT - LUNGE_AT);
    return {
      pose: 'step',
      advance: APPROACH_DISTANCE + (1 - APPROACH_DISTANCE) * ease(progress),
    };
  }

  if (time < RECOVER_AT) {
    return { pose: 'strike', advance: 1 };
  }

  if (time < RETURN_AT) {
    return { pose: 'recover', advance: 1 };
  }

  const progress = (time - RETURN_AT) / (CYCLE_DURATION - RETURN_AT);
  return { pose: 'recover', advance: 1 - ease(progress) };
}

function playCombat(
  style: CSSStyleDeclaration,
  getSpeed: () => 1 | 2,
  setFrame: (frame: CombatFrame) => void,
  onTravel: GameSceneProps['onTravel'],
): () => void {
  let animationId = 0;
  let previousTime: number | null = null;
  let timeToSpawn = SPAWN_INTERVAL;
  let travelElapsed = 0;
  let attackTime = 0;
  let nextId = 0;
  let currentMonster: Monster | null = null;
  let renderedMonster: Monster | null = null;
  let renderedPose: LionPose = 'ready';
  let previousAdvance = 0;

  function animate(timestamp: number) {
    const elapsed = Math.min(timestamp - (previousTime ?? timestamp), 50);
    previousTime = timestamp;
    const speed = getSpeed();

    if (!currentMonster && timeToSpawn > 0) {
      const travelStep = Math.min(elapsed, timeToSpawn);
      // Ease out before the scheduled spawn so the scenery is already still in combat.
      const midpoint = travelStep / 2;
      const ramp = Math.min(
        1,
        (travelElapsed + midpoint) / TRAVEL_RAMP_DURATION,
        (timeToSpawn - midpoint) / TRAVEL_RAMP_DURATION,
      );
      onTravel(travelStep * speed * ease(ramp));
      travelElapsed += travelStep;
    }

    timeToSpawn -= elapsed;

    if (!currentMonster && timeToSpawn <= 0) {
      currentMonster = { id: nextId++, hp: MAX_HP, damage: 0, pose: 'idle' };
      timeToSpawn = SPAWN_INTERVAL;
      travelElapsed = 0;
      attackTime = 0;
    } else if (currentMonster) {
      const previousAttackTime = attackTime;
      // 배속은 장면 연출에만 적용하고 등장 간격과 보상 시간은 실시간을 사용한다.
      attackTime += elapsed * speed;

      if (previousAttackTime < STRIKE_AT && attackTime >= STRIKE_AT) {
        const damage = Math.min(STRIKE_DAMAGE, currentMonster.hp);
        currentMonster = {
          ...currentMonster,
          hp: currentMonster.hp - damage,
          damage,
          pose: 'hit',
        };
      }

      if (currentMonster.pose === 'hit' && attackTime >= STRIKE_AT + HIT_DURATION) {
        currentMonster = {
          ...currentMonster,
          pose: currentMonster.hp === 0 ? 'dying' : 'idle',
        };
      }

      if (currentMonster.hp > 0 && attackTime >= CYCLE_DURATION) {
        attackTime -= CYCLE_DURATION;
      }

      if (currentMonster.pose === 'dying' && attackTime >= STRIKE_AT + HIT_DURATION + DEATH_DURATION) {
        currentMonster = null;
        attackTime = 0;
      }
    }

    const { pose, advance } = lionMotion(attackTime);
    if (advance !== previousAdvance) {
      style.setProperty('--advance', String(advance));
      previousAdvance = advance;
    }

    if (currentMonster?.pose === 'hit') {
      const progress = (attackTime - STRIKE_AT) / HIT_DURATION;
      style.setProperty('--hit-progress', String(progress));
      style.setProperty('--recoil', String(Math.sin(progress * Math.PI) * 7) + 'px');
    } else if (renderedMonster?.pose === 'hit') {
      style.setProperty('--recoil', '0px');
    }

    if (currentMonster?.pose === 'dying') {
      const progress = (attackTime - STRIKE_AT - HIT_DURATION) / DEATH_DURATION;
      style.setProperty('--death-progress', String(progress));
    }

    if (renderedPose !== pose || renderedMonster !== currentMonster) {
      renderedPose = pose;
      renderedMonster = currentMonster;
      setFrame({ lionPose: pose, monster: currentMonster });
    }

    animationId = requestAnimationFrame(animate);
  }

  animationId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animationId);
}

export default function GameScene({
  speed,
  collectedPieces,
  onTravel,
  regionId = 1,
  specialtyName,
}: GameSceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(speed);
  const [frame, setFrame] = useState<CombatFrame>({
    lionPose: 'ready',
    monster: null,
  });

  const isAndong = regionId === 2;
  const monsterKind = MONSTER_KIND_BY_REGION[regionId];
  const pieceName = specialtyName ?? (isAndong ? '간고등어' : '사과');
  const { monster } = frame;
  const isSmall = monster !== null && monster.id % 2 === 1;
  const monsterImages = monsterFrames(monsterKind, isSmall);

  useEffect(() => {
    for (const small of [false, true]) {
      const { idle, hit } = monsterFrames(monsterKind, small);
      preload(idle, { as: 'image' });
      preload(hit, { as: 'image' });
    }
  }, [monsterKind]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    return playCombat(scene.style, () => speedRef.current, setFrame, onTravel);
  }, [onTravel]);

  return (
    <div className="runner-game">
      <div
        ref={sceneRef}
        className="runner-game__scene"
        data-small-target={isSmall}
        data-traveling={monster === null}
        data-speed={speed}
      >
        {monster && (
          <div
            key={monster.id}
            className="runner-game__monster"
            data-pose={monster.pose}
            data-aligned={monsterKind !== undefined}
          >
            <img
              className="runner-game__monster-image"
              src={monsterImages.idle}
              hidden={monster.pose === 'hit'}
              alt=""
              draggable={false}
            />
            <img
              className="runner-game__monster-image runner-game__monster-image--hit"
              src={monsterImages.hit}
              hidden={monster.pose !== 'hit'}
              alt=""
              draggable={false}
            />

            <div
              className="runner-game__apple-health"
              role="progressbar"
              aria-label="몬스터 체력"
              aria-valuemin={0}
              aria-valuemax={MAX_HP}
              aria-valuenow={monster.hp}
            >
              <div
                className="runner-game__apple-health-fill"
                style={{ width: (monster.hp / MAX_HP) * 100 + '%' }}
              />
            </div>

            {monster.pose === 'hit' && (
              <span className="runner-game__damage" aria-hidden="true">
                -{monster.damage}
              </span>
            )}
          </div>
        )}

        <div className="runner-game__player" role="img" aria-label="탐험 사자">
          {Object.entries(LION_FRAMES).map(([pose, src]) => (
            <img
              key={pose}
              className="runner-game__character"
              src={src}
              hidden={(monster ? frame.lionPose : 'step') !== pose}
              alt=""
              draggable={false}
            />
          ))}
        </div>

        <div className="runner-game__pieces">
          <img src={isAndong ? '/regions/andong-mackerel.png' : APPLE_FRAMES[0].idle} alt="" />
          <span>
            현재 보유: {pieceName} 조각{' '}
            {collectedPieces.toLocaleString()}개
          </span>
        </div>
      </div>
    </div>
  );
}
