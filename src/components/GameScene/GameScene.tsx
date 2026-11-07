
import {
  useEffect,
  useRef,
  useState,
} from 'react';

import type { CSSProperties } from 'react';

import './GameScene.css';

interface GameSceneProps {
  speed: 1 | 2;
  collectedPieces: number;
}

interface Apple {
  id: number;
  x: number;
  y: number;
  type: 'normal' | 'special';
}

const PLAYER_X = 23;
const APPLE_SPEED = 38;
const SPAWN_INTERVAL = 1250;

const ASSETS = {
  character: '/game/character.png',
  apple: '/game/apple.png',
  specialApple: '/game/apple-alt.png',
  playerHp: '/game/player-hp.png',
  appleHp: '/game/apple-hp.png',
};

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

    // 캐릭터가 게임 영역 밖으로 벗어나지 않도록 제한
    const nextY = Math.max(
      20,
      Math.min(78, percent),
    );

    playerYRef.current = nextY;
    setPlayerY(nextY);
  }

  // ========================================
  // Animation Loop
  // ========================================

  useEffect(() => {
    let animationId = 0;

    const animate = (timestamp: number) => {
      const previous =
        lastFrameRef.current ?? timestamp;

      const delta = Math.min(
        (timestamp - previous) / 1000,
        0.05,
      );

      lastFrameRef.current = timestamp;

      // 배속은 화면 연출에만 적용
      const scaledDelta = delta * speed;

      const scene = sceneRef.current;

      if (scene) {
        // 사과 생성
        spawnElapsedRef.current +=
          scaledDelta * 1000;

        while (
          spawnElapsedRef.current >= SPAWN_INTERVAL
        ) {
          spawnElapsedRef.current -=
            SPAWN_INTERVAL;

          applesRef.current.push({
            id: nextIdRef.current++,
            x: 110,
            y: 25 + Math.random() * 50,
            type:
              Math.random() < 0.2
                ? 'special'
                : 'normal',
          });
        }

        const rect = scene.getBoundingClientRect();

        // 사과 이동 및 충돌 연출
        applesRef.current = applesRef.current
          .map((apple) => ({
            ...apple,
            x:
              apple.x -
              APPLE_SPEED * scaledDelta,
          }))
          .filter((apple) => {
            if (apple.x < -10) {
              return false;
            }

            const dx =
              ((apple.x - PLAYER_X) / 100) *
              rect.width;

            const dy =
              ((apple.y - playerYRef.current) /
                100) *
              rect.height;

            const distance = Math.hypot(dx, dy);

            // 사과에 닿으면 화면에서 사라지는 연출
            // 실제 조각 지급은 Mock API가 처리
            return distance >= 34;
          });

        setApples([...applesRef.current]);
      }

      animationId = requestAnimationFrame(
        animate,
      );
    };

    animationId = requestAnimationFrame(
      animate,
    );

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
          if (
            pointerRef.current === event.pointerId
          ) {
            pointerRef.current = null;
          }
        }}
        onPointerCancel={(event) => {
          if (
            pointerRef.current === event.pointerId
          ) {
            pointerRef.current = null;
          }
        }}
      >
        {/* Apples */}

        {apples.map((apple) => (
          <div
            key={apple.id}
            className="runner-game__apple"
            style={{
              left: `${apple.x}%`,
              top: `${apple.y}%`,
            }}
          >
            <img
              className="runner-game__apple-image"
              src={
                apple.type === 'special'
                  ? ASSETS.specialApple
                  : ASSETS.apple
              }
              alt=""
              draggable={false}
            />

            <img
              className="runner-game__apple-hp"
              src={ASSETS.appleHp}
              alt=""
              draggable={false}
            />
          </div>
        ))}

        {/* Player */}

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

          <img
            className="runner-game__player-health"
            src={ASSETS.playerHp}
            alt=""
            draggable={false}
          />
        </div>

        {/* Current Owned Pieces */}

        <div className="runner-game__pieces">
          <img
            src={ASSETS.apple}
            alt=""
          />

          <span>
            현재 보유: 사과 조각{' '}
            {collectedPieces.toLocaleString()}개
          </span>
        </div>
      </div>
    </div>
  );
}
