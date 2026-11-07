
import './GameMenu.css';

import quizIcon from '../../assets/explore/quiz.png';
import mapIcon from '../../assets/explore/map.png';
import settingsIcon from '../../assets/explore/settings.png';

interface GameMenuProps {
  onClose: () => void;
  onOpenMap: () => void;
  onNotice: (message: string) => void;
}

export default function GameMenu({
  onClose,
  onOpenMap,
  onNotice,
}: GameMenuProps) {
  const handleNotice = (message: string) => {
    onClose();
    onNotice(message);
  };

  return (
    <>
      <button
        type="button"
        className="game-menu__backdrop"
        aria-label="메뉴 닫기"
        onClick={onClose}
      />

      <nav className="game-menu" aria-label="탐험 메뉴">
        <button
          type="button"
          onClick={() =>
            handleNotice('지역 퀴즈는 준비 중이에요.')
          }
        >
          <span className="game-menu__content">
            <img
              src={quizIcon}
              alt=""
              className="game-menu__icon"
            />
            <span>지역 퀴즈</span>
          </span>
          <span className="game-menu__arrow">›</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenMap();
          }}
        >
          <span className="game-menu__content">
            <img
              src={mapIcon}
              alt=""
              className="game-menu__icon"
            />
            <span>지역 지도</span>
          </span>
          <span className="game-menu__arrow">›</span>
        </button>

        <button
          type="button"
          onClick={() =>
            handleNotice('설정은 준비 중이에요.')
          }
        >
          <span className="game-menu__content">
            <img
              src={settingsIcon}
              alt=""
              className="game-menu__icon"
            />
            <span>설정</span>
          </span>
          <span className="game-menu__arrow">›</span>
        </button>
      </nav>
    </>
  );
}
