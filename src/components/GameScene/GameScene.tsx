import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import './GameScene.css';

interface GameSceneProps {
  speed: 1 | 2;
  collectedPieces: number;
  regionId?: number;
  specialtyName?: string;
}

type MonsterType = 'normal' | 'special';
type MonsterStatus = 'moving' | 'dying';

interface Monster {
  id: number;
  x: number;
  y: number;
  type: MonsterType;
  hp: number;
  status: MonsterStatus;
  deathElapsed: number;
}

const PLAYER_X = 23;
const PLAYER_MIN_Y = 20;
const PLAYER_MAX_Y = 78;

const MONSTER_SPEED = 38;
const SPAWN_INTERVAL = 4000;
const DEATH_DURATION = 450;
const COLLISION_DISTANCE = 34;
const MAX_HP = 100;
const MAX_MONSTERS = 12;

const ASSETS = {
  character: '/game/character.png',
  apple: '/game/apple.png',
  specialApple: '/game/apple-alt.png',
  mackerel: '/regions/andong-mackerel.png',
} as const;

function createMonster(id: number): Monster {
  return {
    id,
    x: 110,
    y: 25 + Math.random() * 50,
    type: id % 2 === 0 ? 'normal' : 'special',
    hp: MAX_HP,
    status: 'moving',
    deathElapsed: 0,
  };
}

export default function GameScene({
  speed,
  collectedPieces,
  regionId = 1,
  specialtyName,
}: GameSceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null);

  const playerYRef = useRef(60);
  const monstersRef = useRef<Monster[]>([]);
  const nextIdRef = useRef(0);

  const lastFrameRef = useRef<number | null>(null);
  const spawnElapsedRef = useRef(0);
  const pointerRef = useRef<number | null>(null);

  const [playerY, setPlayerY] = useState(60);
  const [monsters, setMonsters] = useState<Monster[]>([]);

  const isAndong = regionId === 2;

  const monsterImage = isAndong
    ? ASSETS.mackerel
    : ASSETS.apple;

  const specialMonsterImage = isAndong
    ? ASSETS.mackerel
    : ASSETS.specialApple;

  const pieceName =
    specialtyName ?? (isAndong ? '간고등어' : '사과');

  // ========================================
  // Player Movement
  // ========================================

  function movePlayer(clientY: number) {
    const scene = sceneRef.current;
    if (!scene) return;

    const rect = scene.getBoundingClientRect();

    if (rect.height <= 0) return;

    const percent =
      ((clientY - rect.top) / rect.height) * 100;

    const nextY = Math.max(
      PLAYER_MIN_Y,
      Math.min(PLAYER_MAX_Y, percent),
    );

    playerYRef.current = nextY;
    setPlayerY(nextY);
  }

  function releasePointer(pointerId: number) {
    if (pointerRef.current === pointerId) {
      pointerRef.current = null;
    }
  }

  // ========================================
  // Reset Scene When Region Changes
  // ========================================

  useEffect(() => {
    monstersRef.current = [];
    nextIdRef.current = 0;
    spawnElapsedRef.current = 0;

    setMonsters([]);
  }, [regionId]);

  // ========================================
  // Animation Loop
  // ========================================

  useEffect(() => {
    let animationId = 0;

    const animate = (timestamp: number) => {
      const previous = lastFrameRef.current ?? timestamp;

      const delta = Math.max(
        0,
        Math.min((timestamp - previous) / 1000, 0.05),
      );

      lastFrameRef.current = timestamp;

      // 2배속은 화면 애니메이션에만 적용
      const movementDelta = delta * speed;

      const scene = sceneRef.current;

      if (scene) {
        // ------------------------------------
        // Monster Spawn
        // ------------------------------------

        spawnElapsedRef.current += delta * 1000;

        while (
          spawnElapsedRef.current >= SPAWN_INTERVAL
        ) {
          spawnElapsedRef.current -= SPAWN_INTERVAL;

          if (
            monstersRef.current.length < MAX_MONSTERS
          ) {
            monstersRef.current.push(
              createMonster(nextIdRef.current++),
            );
          }
        }

        // ------------------------------------
        // Monster Movement & Collision
        // ------------------------------------

        const rect = scene.getBoundingClientRect();

        monstersRef.current = monstersRef.current
          .map((monster): Monster => {
            if (monster.status === 'dying') {
              return {
                ...monster,
                deathElapsed:
                  monster.deathElapsed + delta * 1000,
              };
            }

            const nextX =
              monster.x - MONSTER_SPEED * movementDelta;

            const dx =
              ((nextX - PLAYER_X) / 100) *
              rect.width;

            const dy =
              ((monster.y - playerYRef.current) / 100) *
              rect.height;

            const distance = Math.hypot(dx, dy);

            if (distance < COLLISION_DISTANCE) {
              return {
                ...monster,
                x: nextX,
                hp: 0,
                status: 'dying',
                deathElapsed: 0,
              };
            }

            return {
              ...monster,
              x: nextX,
            };
          })
          .filter((monster) => {
            if (monster.status === 'dying') {
              return monster.deathElapsed < DEATH_DURATION;
            }

            return monster.x >= -10;
          });

        setMonsters([...monstersRef.current]);
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      lastFrameRef.current = null;
    };
  }, [speed]);

  // ========================================
  // Render
  // ========================================

  return (
    <div
      className="runner-game"
      style={
        {
          '--game-speed': speed,
        } as CSSProperties
      }
    >
      <div
        ref={sceneRef}
        className="runner-game__scene"
        onPointerDown={(event) => {
          pointerRef.current = event.pointerId;

          event.currentTarget.setPointerCapture(
            event.pointerId,
          );

          movePlayer(event.clientY);
        }}
        onPointerMove={(event) => {
          if (
            pointerRef.current !== event.pointerId
          ) {
            return;
          }

          movePlayer(event.clientY);
        }}
        onPointerUp={(event) => {
          releasePointer(event.pointerId);
        }}
        onPointerCancel={(event) => {
          releasePointer(event.pointerId);
        }}
      >
        {/* ========================================
            Scrolling Game Background
        ======================================== */}

        <div
          className="runner-game__background"
          aria-hidden="true"
        />

        {/* ========================================
            Monsters
        ======================================== */}

        {monsters.map((monster) => {
          const isDying =
            monster.status === 'dying';

          const isLarge =
            monster.type === 'normal';

          return (
            <div
              key={monster.id}
              className={`runner-game__apple ${
                isDying
                  ? 'runner-game__apple--dying'
                  : ''
              }`}
              style={{
                left: `${monster.x}%`,
                top: `${monster.y}%`,
              }}
            >
              <div
                className={`runner-game__apple-content ${
                  isLarge
                    ? 'runner-game__apple-content--large'
                    : ''
                }`}
              >
                <img
                  className="runner-game__apple-image"
                  src={
                    isLarge
                      ? monsterImage
                      : specialMonsterImage
                  }
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
                    style={{
                      width: `${monster.hp}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* ========================================
            Player
        ======================================== */}

        <div
          className="runner-game__player"
          style={{
            top: `${playerY}%`,
          }}
        >
          <img
            className="runner-game__character"
            src={ASSETS.character}
            alt="달리는 사자"
            draggable={false}
          />
        </div>

        {/* ========================================
            Collected Pieces
        ======================================== */}

        <div className="runner-game__pieces">
          <img src={monsterImage} alt="" />

          <span>
            현재 보유: {pieceName} 조각{' '}
            {collectedPieces.toLocaleString()}개
          </span>
        </div>
      </div>
    </div>
  );
}
