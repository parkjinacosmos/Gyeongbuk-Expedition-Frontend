import { useEffect, useRef, useState } from 'react';

import type {
  QuizResult,
  QuizQuestion,
} from '../../api/quiz';

import appleIcon from '../../assets/popup/apple.png';
import calendarIcon from '../../assets/popup/calendar.png';
import lionIcon from '../../assets/popup/lion.png';

import './QuizPopup.css';

// ========================================
// Types
// ========================================

export type QuizPopupType =
  | 'completed'
  | 'correct'
  | 'incorrect';

interface QuizPopupProps {
  type: QuizPopupType;
  result: QuizResult | null;
  questions: QuizQuestion[];
  onClose: () => void;
}

// ========================================
// Popup Icons
// ========================================

const popupIcons = {
  completed: calendarIcon,
  correct: lionIcon,
  incorrect: appleIcon,
};

// ========================================
// Quiz Popup
// ========================================

export default function QuizPopup({
  type,
  result,
  questions,
  onClose,
}: QuizPopupProps) {
  const [showExplanations, setShowExplanations] =
    useState(false);

  const confirmButtonRef =
    useRef<HTMLButtonElement>(null);

  const popupRef =
    useRef<HTMLElement>(null);

  const isCompleted = type === 'completed';
  const isCorrect = type === 'correct';

  const correctCount = result?.correct_count ?? 0;
  const totalCount = result?.total ?? questions.length;

  // 실제 백엔드 보상 결과
  const rewardedGold = result?.rewarded.gold;
  const rewardedExp = result?.rewarded.exp;

  // ========================================
  // Popup Text
  // ========================================

  const title = isCompleted
    ? '퀴즈 · 오늘 참여 완료'
    : isCorrect
      ? '퀴즈 · 정답 결과'
      : '퀴즈 · 오답 결과';

  const description = isCompleted
    ? result
      ? `오늘의 퀴즈에 이미 참여했어요. ${totalCount}문제 중 ${correctCount}문제를 맞혔어요!`
      : '오늘의 퀴즈에 이미 참여했어요. 내일 다시 만나요!'
    : isCorrect
      ? '정답입니다! 오늘의 퀴즈를 모두 맞혔어요.'
      : `오늘은 ${correctCount}문제를 맞혔어요. 정답과 해설을 확인해 보세요.`;

  const rewardText = result
    ? `오늘 참여 완료 · +${rewardedGold?.toLocaleString() ?? 0}골드 · +${rewardedExp?.toLocaleString() ?? 0}XP`
    : '하루 1회 참여 가능';

  // ========================================
  // Keyboard Accessibility
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

      const buttons =
        popupRef.current?.querySelectorAll<HTMLButtonElement>(
          'button:not(:disabled)',
        );

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
    <div className="quiz-popup-backdrop">
      <section
        ref={popupRef}
        className="quiz-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-popup-title"
      >
        {/* Title */}
        <h2
          id="quiz-popup-title"
          className="quiz-popup__title"
        >
          {title}
        </h2>

        {/* Icon */}
        <img
          className="quiz-popup__image"
          src={popupIcons[type]}
          alt=""
        />

        {/* Description */}
        <p className="quiz-popup__description">
          {description}
        </p>

        {/* Reward Status */}
        <p className="quiz-popup__status">
          {rewardText}
        </p>

        {/* Correct Answers & Explanations */}
        {result && questions.length > 0 && (
          <>
            <button
              type="button"
              className="quiz-popup__explanation-toggle"
              aria-expanded={showExplanations}
              onClick={() =>
                setShowExplanations((prev) => !prev)
              }
            >
              {showExplanations
                ? '정답 및 해설 접기'
                : '정답 및 해설 보기'}
            </button>

            {showExplanations && (
              <div className="quiz-popup__explanations">
                {questions.map((question) => {
                  const answer = result.answers.find(
                    (item) =>
                      item.order_no === question.order_no,
                  );

                  if (!answer) return null;

                  const correctChoice =
                    question.choices[answer.answer_index];

                  const selectedChoice =
                    question.choices[answer.selected_index];

                  return (
                    <article
                      key={question.order_no}
                      className="quiz-popup__explanation"
                    >
                      <strong>
                        {answer.is_correct ? '✓' : '✕'}{' '}
                        {question.order_no}.{' '}
                        {question.question}
                      </strong>

                      <p>
                        정답:{' '}
                        {correctChoice ?? '정답 정보 없음'}
                      </p>

                      {!answer.is_correct && (
                        <p>
                          내 답변:{' '}
                          {selectedChoice ?? '선택 정보 없음'}
                        </p>
                      )}

                      <small>
                        {answer.explanation}
                      </small>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Confirm Button */}
        <button
          ref={confirmButtonRef}
          type="button"
          className={`quiz-popup__confirm ${
            isCompleted
              ? 'quiz-popup__confirm--completed'
              : ''
          }`}
          onClick={onClose}
        >
          {isCompleted ? '닫기' : '확인'}
        </button>
      </section>
    </div>
  );
}
