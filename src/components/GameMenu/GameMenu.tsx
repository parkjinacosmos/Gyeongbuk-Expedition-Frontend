import { useEffect, useRef } from 'react';

import './GameMenu.css';

import quizIcon from '../../assets/explore/quiz.png';
import mapIcon from '../../assets/explore/map.png';
import settingsIcon from '../../assets/explore/settings.png';
import guideIcon from '../../assets/popup/lion.png';
import { OPEN_CHAT_EVENT } from '../../api/chat';

interface GameMenuProps {
  onClose: () => void;
  onOpenMap: () => void;
  onOpenQuiz: () => void;
  onNotice: (message: string) => void;
}

export default function GameMenu({
  onClose,
  onOpenMap,
  onOpenQuiz,
  onNotice,
}: GameMenuProps) {
  const menuRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  // ========================================
  // Keyboard Handling
  // ========================================

  useEffect(() => {
    const previousFocus = document.activeElement;

    const firstButton =
      menuRef.current?.querySelector<HTMLButtonElement>(
        'button',
      );

    firstButton?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, []);

  // ========================================
  // Navigation
  // ========================================

  function handleOpenQuiz() {
    onClose();
    onOpenQuiz();
  }

  function handleOpenChat() {
    onClose();
    window.dispatchEvent(new Event(OPEN_CHAT_EVENT));
  }

  function handleOpenMap() {
    onClose();
    onOpenMap();
  }

  function handleNotice(message: string) {
    onClose();
    onNotice(message);
  }

  // ========================================
  // Render
  // ========================================

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="game-menu__backdrop"
        aria-label="메뉴 닫기"
        onClick={onClose}
      />

      {/* Menu */}
      <nav
        ref={menuRef}
        className="game-menu"
        aria-label="탐험 메뉴"
      >
        {/* Chat */}
        <button
          type="button"
          onClick={handleOpenChat}
        >
          <span className="game-menu__content">
            <img
              src={guideIcon}
              alt=""
              className="game-menu__icon"
            />
            <span>탐험 도우미</span>
          </span>

          <span
            className="game-menu__arrow"
            aria-hidden="true"
          >
            ›
          </span>
        </button>

        {/* Quiz */}
        <button
          type="button"
          onClick={handleOpenQuiz}
        >
          <span className="game-menu__content">
            <img
              src={quizIcon}
              alt=""
              className="game-menu__icon"
            />
            <span>지역 퀴즈</span>
          </span>

          <span
            className="game-menu__arrow"
            aria-hidden="true"
          >
            ›
          </span>
        </button>

        {/* Map */}
        <button
          type="button"
          onClick={handleOpenMap}
        >
          <span className="game-menu__content">
            <img
              src={mapIcon}
              alt=""
              className="game-menu__icon"
            />
            <span>지역 지도</span>
          </span>

          <span
            className="game-menu__arrow"
            aria-hidden="true"
          >
            ›
          </span>
        </button>

        {/* Settings */}
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

          <span
            className="game-menu__arrow"
            aria-hidden="true"
          >
            ›
          </span>
        </button>
      </nav>
    </>
  );
}
