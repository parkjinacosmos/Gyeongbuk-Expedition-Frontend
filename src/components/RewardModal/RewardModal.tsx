
import { useEffect } from 'react';

import treasureIcon from '../../assets/explore/treasure.png';
import happyLion from '../../assets/explore/happy-lion.png';
import goldImage from '../../assets/explore/gold.png';
import appleImage from '../../assets/explore/apple.png';

import './RewardModal.css';

interface RewardModalProps {
  gold: number;
  exp: number;
  pieces: number;

  totalGold: number;
  currentExp: number;
  totalPieces: number;

  explorationSeconds: number;
  specialtyName?: string;

  onClose: () => void;
  onContinue: () => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }

  if (minutes > 0) {
    return `${minutes}분`;
  }

  return `${Math.max(0, seconds)}초`;
}

export default function RewardModal({
  gold,
  exp,
  pieces,
  totalGold,
  currentExp,
  totalPieces,
  explorationSeconds,
  specialtyName = '사과',
  onClose,
  onContinue,
}: RewardModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="reward-overlay">
      <div
        className="reward-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-popup-title"
      >
        <img
          src={treasureIcon}
          alt=""
          className="reward-popup__treasure"
        />

        <div className="reward-popup__heading">
          <h2 id="reward-popup-title">
            보상 수령 완료!
          </h2>
        </div>

        <div className="reward-popup__content">
          <div className="reward-popup__exploration">
            <img
              src={happyLion}
              alt="기뻐하는 탐험 사자"
              className="reward-popup__character"
            />

            <div>
              <strong>
                탐험 시간 {formatDuration(explorationSeconds)}
              </strong>
              <p>최대 누적 시간 8시간</p>
            </div>
          </div>

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
              <strong>+{gold.toLocaleString()}</strong>
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
              <strong>+{exp.toLocaleString()}</strong>
            </div>

            <div className="reward-popup__item">
              <span>
                <img
                  src={appleImage}
                  alt=""
                  className="reward-popup__item-icon"
                />
                {specialtyName} 조각
              </span>
              <strong>+{pieces.toLocaleString()}</strong>
            </div>
          </div>

          <div className="reward-popup__info">
            <p>탐험 중 특산물 조각을 획득할 수 있어요.</p>
            <strong>
              지역마다 조각 획득 확률이 달라집니다.
            </strong>
            <small>
              정확한 획득 확률은 추후 적용됩니다.
            </small>
          </div>

          <div className="reward-popup__totals">
            <div>
              <span>총 골드</span>
              <strong>{totalGold.toLocaleString()}</strong>
            </div>

            <div>
              <span>현재 EXP</span>
              <strong>{currentExp.toLocaleString()}</strong>
            </div>

            <div>
              <span>{specialtyName} 조각</span>
              <strong>{totalPieces.toLocaleString()}</strong>
            </div>
          </div>

          <div className="reward-popup__actions">
            <button
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
