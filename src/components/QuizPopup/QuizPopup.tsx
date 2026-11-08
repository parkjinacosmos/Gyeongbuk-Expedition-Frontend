
import { useState } from 'react';
import type { QuizResult, QuizQuestion } from '../../api/quiz';

import appleIcon from '../../assets/popup/apple.png';
import calendarIcon from '../../assets/popup/calendar.png';
import lionIcon from '../../assets/popup/lion.png';

import './QuizPopup.css';

export type QuizPopupType = 'completed' | 'correct' | 'incorrect';

interface QuizPopupProps {
  type: QuizPopupType;
  result: QuizResult | null;
  questions: QuizQuestion[];
  onClose: () => void;
}

const popupIcons = {
  completed: calendarIcon,
  correct: lionIcon,
  incorrect: appleIcon,
};

export default function QuizPopup({
  type,
  result,
  questions,
  onClose,
}: QuizPopupProps) {
  const [showExplanations, setShowExplanations] = useState(false);

  const isCompleted = type === 'completed';
  const isCorrect = type === 'correct';

  const title = isCompleted
    ? '퀴즈 · 오늘 참여 완료'
    : isCorrect
      ? '퀴즈 · 정답 결과'
      : '퀴즈 · 오답 결과';

  const description = isCompleted
    ? '오늘의 퀴즈에 이미 참여했어요. 내일 다시 만나요!'
    : isCorrect
      ? '정답입니다! 오늘의 퀴즈를 모두 맞혔어요.'
      : `오늘은 ${result?.correct_count ?? 0}문제를 맞혔어요. 정답과 해설을 확인해 보세요.`;

  return (
    <div className="quiz-popup-backdrop">
      <section
        className="quiz-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-popup-title"
      >
        <h2 id="quiz-popup-title" className="quiz-popup__title">
          {title}
        </h2>

        <img
          className="quiz-popup__image"
          src={popupIcons[type]}
          alt=""
        />

        <p className="quiz-popup__description">
          {description}
        </p>

        <p className="quiz-popup__status">
          {isCompleted
            ? '하루 1회 참여 가능'
            : `오늘 참여 완료 · +${result?.rewarded.gold ?? 100}골드 · +${result?.rewarded.exp ?? 20}XP`}
        </p>

        {result && questions.length > 0 && (
          <>
            <button
              type="button"
              className="quiz-popup__explanation-toggle"
              aria-expanded={showExplanations}
              onClick={() => setShowExplanations((prev) => !prev)}
            >
              {showExplanations
                ? '정답 및 해설 접기'
                : '정답 및 해설 보기'}
            </button>

            {showExplanations && (
              <div className="quiz-popup__explanations">
                {questions.map((question) => {
                  const answer = result.answers.find(
                    (item) => item.order_no === question.order_no,
                  );

                  if (!answer) return null;

                  return (
                    <article
                      key={question.order_no}
                      className="quiz-popup__explanation"
                    >
                      <strong>
                        {answer.is_correct ? '✓' : '✕'}{' '}
                        {question.order_no}. {question.question}
                      </strong>

                      <p>
                        정답: {question.choices[answer.answer_index]}
                      </p>

                      <small>{answer.explanation}</small>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        <button
          type="button"
          className={`quiz-popup__confirm ${
            isCompleted ? 'quiz-popup__confirm--completed' : ''
          }`}
          onClick={onClose}
        >
          {isCompleted ? '닫기' : '확인'}
        </button>
      </section>
    </div>
  );
}
