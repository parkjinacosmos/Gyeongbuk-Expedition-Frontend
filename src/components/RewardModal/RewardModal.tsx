import { useEffect, useRef } from 'react';

import treasureIcon from '../../assets/explore/treasure.png';
import happyLion from '../../assets/explore/happy-lion.png';
import goldImage from '../../assets/explore/gold.png';
import appleImage from '../../assets/explore/apple.png';
import mackerelImage from '../../assets/explore/mackerel.png';

import './RewardModal.css';

// ========================================
// Types
// ========================================

interface RewardModalProps {
  gold: number;
  exp: number;
  pieces: number;
  totalGold: number;
  currentExp: number;
  totalPieces: number;
  explorationSeconds: number;
  specialtyName?: string;
  dropRateBp: number;
  mobsDefeated: number;
  onClose: () => void;
  onContinue: () => void;
}

// ========================================
// Helpers
// ========================================

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }

  if (minutes > 0) {
    return `${minutes}분`;
  }

  return `${safeSeconds}초`;
}

function getSpecialtyImage(name: string): string {
  if (name.includes('고등어')) {
    return mackerelImage;
  }

  return appleImage;
}

// ========================================
// Reward Modal
// ========================================

export default function RewardModal({
  gold,
  exp,
  pieces,
  totalGold,
  currentExp,
  totalPieces,
  explorationSeconds,
  specialtyName = '사과',
  dropRateBp,
  mobsDefeated,
  onClose,
  onContinue,
}: RewardModalProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const specialtyImage = getSpecialtyImage(specialtyName);

  // ========================================
  // Modal Keyboard Handling
  // ========================================

  useEffect(() => {
    const previousFocus = document.activeElement;

    confirmButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const buttons = dialogRef.current?.querySelectorAll<
        HTMLButtonElement
      >('button:not(:disabled)');

      if (!buttons || buttons.length === 0) return;

      const first = buttons[0];
      const last = buttons[buttons.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [onClose]);

  // ========================================
  // Render
  // ========================================

  return (
    <div className="reward-overlay">
      <div
        ref={dialogRef}
        className="reward-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-popup-title"
      >
        {/* Treasure Icon */}
        <img
          src={treasureIcon}
          alt=""
          className="reward-popup__treasure"
        />

        {/* Title */}
        <div className="reward-popup__heading">
          <h2 id="reward-popup-title">
            보상 수령 완료!
          </h2>
        </div>

        <div className="reward-popup__content">
          {/* Exploration Time */}
          <div className="reward-popup__exploration">
            <img
              src={happyLion}
              alt="기뻐하는 탐험 사자"
              className="reward-popup__character"
            />

            <div>
              <strong>
                탐험 시간{' '}
                {formatDuration(explorationSeconds)}
              </strong>

              <p>최대 누적 시간 8시간</p>
            </div>
          </div>

          {/* Reward Items */}
          <div className="reward-popup__items">
            <div className="reward-popup__item">
              <span>
                <img
                  src={goldImage}
                  alt=""
                  className="reward-popup__item-icon"
                />
                골드
              </span>

              <strong>
                +{gold.toLocaleString()}
              </strong>
            </div>

            <div className="reward-popup__item">
              <span>
                <img
                  src="/game/exp.png"
                  alt=""
                  className="reward-popup__item-icon"
                />
                경험치 (EXP)
              </span>

              <strong>
                +{exp.toLocaleString()}
              </strong>
            </div>

            <div className="reward-popup__item">
              <span>
                <img
                  src={specialtyImage}
                  alt=""
                  className="reward-popup__item-icon"
                />
                {specialtyName} 조각
              </span>

              <strong>
                +{pieces.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Reward Information */}
          <div className="reward-popup__info">
            <p>
              몬스터{' '}
              {mobsDefeated.toLocaleString()}마리 처치!
            </p>

            <strong>
              {specialtyName} 조각 획득 확률{' '}
              {(dropRateBp / 100).toFixed(2)}%
            </strong>

            <small>
              300회 연속 실패 시 다음 처치에서 확정 획득
            </small>
          </div>

          {/* Total Rewards */}
          <div className="reward-popup__totals">
            <div>
              <span>총 골드</span>

              <strong>
                {totalGold.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>현재 EXP</span>

              <strong>
                {currentExp.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>{specialtyName} 조각</span>

              <strong>
                {totalPieces.toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Actions */}
          <div className="reward-popup__actions">
            <button
              ref={confirmButtonRef}
              type="button"
              className="reward-popup__button reward-popup__button--confirm"
              onClick={onClose}
            >
              확인
            </button>

            <button
              type="button"
              className="reward-popup__button reward-popup__button--continue"
              onClick={onContinue}
            >
              계속 탐험
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
