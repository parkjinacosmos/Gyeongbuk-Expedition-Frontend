
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

import './GameScene.css';

interface GameSceneProps {
  speed: 1 | 2;
  collectedPieces: number;
  lastSettledAt?: string;
  serverOffsetMs?: number;
  carrySeconds?: number;
}

type AppleType = 'normal' | 'special';
type AppleStatus = 'moving' | 'dying';

interface Apple {
  id: number;
  x: number;
  y: number;
  type: AppleType;
  hp: number;
  status: AppleStatus;
  deathElapsed: number;
}

const PLAYER_X = 23;
const PLAYER_MIN_Y = 20;
const PLAYER_MAX_Y = 78;

const APPLE_SPEED = 38;
const SPAWN_INTERVAL = 4000;
const DEATH_DURATION = 450;
const COLLISION_DISTANCE = 34;
const MAX_HP = 100;

const ASSETS = {
  character: '/game/character.png',
  apple: '/game/apple.png',
  specialApple: '/game/apple-alt.png',
} as const;

// 사과가 번갈아 등장하도록 생성
function createApple(id: number): Apple {
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
}: GameSceneProps) {
  const sceneRef = useRef<HTMLDivElement>(null);

  const playerYRef = useRef(60);
  const applesRef = useRef<Apple[]>([]);
  const nextIdRef = useRef(0);

  const lastFrameRef = useRef<number | null>(null);
  const spawnElapsedRef = useRef(0);
  const pointerRef = useRef<number | null>(null);

  const [playerY, setPlayerY] = useState(60);
  const [apples, setApples] = useState<Apple[]>([]);

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
  // Animation Loop
  // ========================================

  useEffect(() => {
    let animationId = 0;

    const animate = (timestamp: number) => {
      const previous =
        lastFrameRef.current ?? timestamp;

      const delta = Math.max(
        0,
        Math.min((timestamp - previous) / 1000, 0.05),
      );

      lastFrameRef.current = timestamp;

      // 배속은 화면 연출에만 적용
      const movementDelta = delta * speed;

      const scene = sceneRef.current;

      if (scene) {
        // ------------------------------------
        // Apple Spawn
        // ------------------------------------

        spawnElapsedRef.current += delta * 1000;

        while (
          spawnElapsedRef.current >= SPAWN_INTERVAL
        ) {
          spawnElapsedRef.current -= SPAWN_INTERVAL;

          applesRef.current.push(
            createApple(nextIdRef.current++),
          );
        }

        // ------------------------------------
        // Apple Movement & Collision
        // ------------------------------------

        const rect = scene.getBoundingClientRect();

        applesRef.current = applesRef.current
          .map((apple): Apple => {
            // 사망 중인 사과는 이동하지 않음
            if (apple.status === 'dying') {
              return {
                ...apple,
                deathElapsed:
                  apple.deathElapsed + delta * 1000,
              };
            }

            const nextX =
              apple.x - APPLE_SPEED * movementDelta;

            const dx =
              ((nextX - PLAYER_X) / 100) *
              rect.width;

            const dy =
              ((apple.y - playerYRef.current) / 100) *
              rect.height;

            const distance = Math.hypot(dx, dy);

            // 사자와 충돌하면 체력 0
            if (distance < COLLISION_DISTANCE) {
              return {
                ...apple,
                x: nextX,
                hp: 0,
                status: 'dying',
                deathElapsed: 0,
              };
            }

            return {
              ...apple,
              x: nextX,
            };
          })
          .filter((apple) => {
            if (apple.status === 'dying') {
              return apple.deathElapsed < DEATH_DURATION;
            }

            return apple.x >= -10;
          });

        setApples([...applesRef.current]);
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
          if (pointerRef.current !== event.pointerId) {
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
        {/* ==================================
            Apples
        ================================== */}

        {apples.map((apple) => {
          const isDying = apple.status === 'dying';
          const isLarge = apple.type === 'normal';

          return (
            <div
              key={apple.id}
              className={`runner-game__apple ${
                isDying
                  ? 'runner-game__apple--dying'
                  : ''
              }`}
              style={{
                left: `${apple.x}%`,
                top: `${apple.y}%`,
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
                      ? ASSETS.apple
                      : ASSETS.specialApple
                  }
                  alt=""
                  draggable={false}
                />

                {/* 체력바: 사과 바로 아래 */}
                <div
                  className="runner-game__apple-health"
                  role="progressbar"
                  aria-label="사과 몬스터 체력"
                  aria-valuemin={0}
                  aria-valuemax={MAX_HP}
                  aria-valuenow={apple.hp}
                >
                  <div
                    className="runner-game__apple-health-fill"
                    style={{
                      width: `${apple.hp}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {/* ==================================
            Player
        ================================== */}

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

        {/* ==================================
            Collected Pieces
        ================================== */}

        <div className="runner-game__pieces">
          <img src={ASSETS.apple} alt="" />

          <span>
            현재 보유: 사과 조각{' '}
            {collectedPieces.toLocaleString()}개
          </span>
        </div>
      </div>
    </div>
  );
}
