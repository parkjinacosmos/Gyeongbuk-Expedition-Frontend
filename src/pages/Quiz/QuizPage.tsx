import { useEffect, useRef, useState } from 'react';

import { exploreApi, type ExploreUser } from '../../api/explore';
import { quizApi, type QuizSet } from '../../api/quiz';

import GameMenu from '../../components/GameMenu/GameMenu';
import QuizPopup, {
  type QuizPopupType,
} from '../../components/QuizPopup/QuizPopup';

import appleImage from '../../assets/explore/apple.png';
import mackerelImage from '../../assets/explore/mackerel.png';
import goldImage from '../../assets/explore/gold.png';
import profileImage from '../../assets/explore/profile.png';
import menuImage from '../../assets/explore/menu.png';

import './QuizPage.css';

interface QuizPageProps {
  onOpenMap: () => void;
  onBack: () => void;
}

interface PendingSubmission {
  setId: number;
  key: string;
  answers: {
    order_no: number;
    selected_index: number;
  }[];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '잠시 후 다시 시도해 주세요.';
}

function getErrorCode(error: unknown): string {
  if (
    error !== null &&
    typeof error === 'object' &&
    'code' in error
  ) {
    return String(error.code);
  }

  return '';
}

function getPopupType(set: QuizSet): QuizPopupType {
  if (!set.result) {
    return 'completed';
  }

  return set.result.correct_count === set.result.total
    ? 'correct'
    : 'incorrect';
}

function getSavedAnswers(set: QuizSet): Record<number, number> {
  const saved: Record<number, number> = {};

  for (const question of set.questions) {
    if (question.selected_index !== null) {
      saved[question.order_no] = question.selected_index;
    }
  }

  return saved;
}

export default function QuizPage({
  onOpenMap,
  onBack,
}: QuizPageProps) {
  const [user, setUser] = useState<ExploreUser | null>(null);
  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);

  const [answers, setAnswers] =
    useState<Record<number, number>>({});

  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [popupType, setPopupType] =
    useState<QuizPopupType | null>(null);

  const [message, setMessage] = useState('');

  const mounted = useRef(false);
  const submittingRef = useRef(false);

  // 실패한 요청을 동일한 키와 답변으로 재시도
  const pendingSubmission =
    useRef<PendingSubmission | null>(null);

  // ========================================
  // Load Quiz
  // ========================================

  useEffect(() => {
    mounted.current = true;

    async function loadQuiz() {
      setLoading(true);
      setMessage('');

      try {
        const [player, issued] = await Promise.all([
          exploreApi.getUser(),
          quizApi.issue(),
        ]);

        if (!mounted.current) return;

        setUser(player);
        setQuizSet(issued.set);
        setAnswers(getSavedAnswers(issued.set));
        setCurrentIndex(0);

        if (issued.set.status === 'SUBMITTED') {
          setPopupType('completed');
        }
      } catch (error) {
        if (!mounted.current) return;

        setMessage(
          `퀴즈를 불러오지 못했어요. ${getErrorMessage(error)}`,
        );
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    }

    void loadQuiz();

    return () => {
      mounted.current = false;
    };
  }, []);

  // ========================================
  // Derived Data
  // ========================================

  const questions = quizSet?.questions ?? [];
  const question = questions[currentIndex];

  const completed = quizSet?.status === 'SUBMITTED';
  const result = quizSet?.result ?? null;

  const answeredCount = questions.filter(
    (item) => answers[item.order_no] !== undefined,
  ).length;

  const allAnswered =
    questions.length > 0 &&
    answeredCount === questions.length;

  // ========================================
  // Select Answer
  // ========================================

  function selectAnswer(index: number) {
    if (
      !question ||
      completed ||
      submittingRef.current
    ) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [question.order_no]: index,
    }));

    // 답변을 수정하면 이전 실패 요청은 재사용하지 않음
    pendingSubmission.current = null;
  }

  // ========================================
  // Result Popup
  // ========================================

  function openResultPopup() {
    if (!quizSet || !result) {
      setMessage('퀴즈 결과를 불러오지 못했어요.');
      return;
    }

    setPopupType(getPopupType(quizSet));
  }

  // ========================================
  // Submit Quiz
  // ========================================

  async function submitQuiz() {
    if (
      !quizSet ||
      !allAnswered ||
      completed ||
      submittingRef.current
    ) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setMessage('');

    const request: PendingSubmission =
      pendingSubmission.current?.setId === quizSet.set_id
        ? pendingSubmission.current
        : {
            setId: quizSet.set_id,
            key: crypto.randomUUID(),
            answers: questions.map((item) => ({
              order_no: item.order_no,
              selected_index: answers[item.order_no],
            })),
          };

    pendingSubmission.current = request;

    try {
      const response = await quizApi.submit(
        request.setId,
        request.answers,
        request.key,
      );

      if (!mounted.current) return;

      pendingSubmission.current = null;

      setQuizSet(response.set);
      setAnswers(getSavedAnswers(response.set));

      if (response.set.result) {
        setPopupType(getPopupType(response.set));
      } else {
        setMessage(
          '제출은 완료되었지만 결과를 불러오지 못했어요.',
        );
      }

      try {
        const updatedUser = await exploreApi.getUser();

        if (mounted.current) {
          setUser(updatedUser);
        }
      } catch {
        // 퀴즈 결과 표시는 유지
      }
    } catch (error) {
      if (!mounted.current) return;

      // 서버에서 이미 제출이 완료되었는지 확인
      try {
        const latest = await quizApi.today();

        if (
          latest.set_id === request.setId &&
          latest.status === 'SUBMITTED'
        ) {
          pendingSubmission.current = null;

          setQuizSet(latest);
          setAnswers(getSavedAnswers(latest));
          setPopupType(getPopupType(latest));

          try {
            const updatedUser = await exploreApi.getUser();

            if (mounted.current) {
              setUser(updatedUser);
            }
          } catch {
            // 결과는 유지
          }

          return;
        }
      } catch {
        // 상태 조회 실패 시 기존 오류 표시
      }

      if (getErrorCode(error) === 'QUIZ_ALREADY_SUBMITTED') {
        setMessage(
          '오늘의 퀴즈는 이미 제출했어요. 화면을 다시 열어 결과를 확인해 주세요.',
        );
      } else {
        setMessage(
          `퀴즈 제출에 실패했어요. ${getErrorMessage(error)}`,
        );
      }
    } finally {
      submittingRef.current = false;

      if (mounted.current) {
        setSubmitting(false);
      }
    }
  }

  // ========================================
  // Render
  // ========================================

  return (
    <main className="quiz-page">
      <div
        className="quiz-page__background"
        aria-hidden="true"
      />

      <div className="quiz-page__viewport">
        {/* Header */}
        <header className="quiz-hud">
          <div className="quiz-hud__profile">
            <img src={profileImage} alt="" />

            <div>
              <strong>Lv.{user?.level ?? '—'}</strong>
              <span>{user?.name ?? '원정대원'}</span>
            </div>
          </div>

          <div className="quiz-hud__region">
            <span>
              현재 지역{' '}
              {user?.cur_region.code ??
                quizSet?.region.code ??
                '—'}
            </span>

            <strong>
              <img
                src={
                  (user?.cur_region.id ??
                    quizSet?.region.id) === 2
                    ? mackerelImage
                    : appleImage
                }
                alt=""
              />

              {user?.cur_region.name ??
                quizSet?.region.name ??
                '지역'}
            </strong>
          </div>

          <div className="quiz-hud__gold">
            <img src={goldImage} alt="" />

            <strong>
              {user?.gold.toLocaleString() ?? '—'}
            </strong>
          </div>

          <button
            type="button"
            className="quiz-hud__menu"
            aria-label="메뉴 열기"
            onClick={() => setMenuOpen(true)}
          >
            <img src={menuImage} alt="" />
          </button>
        </header>

        {/* Quiz Content */}
        <section className="quiz-content">
          <div className="quiz-wood-sign">
            <h1>오늘의 퀴즈</h1>
          </div>

          <div className="quiz-reward-panel">
            <strong>참여 보상: 100골드 + 20XP</strong>
            <span>하루 1회 참여 가능</span>
          </div>

          <img
            className="quiz-character"
            src="/quiz/quiz-illustration.png"
            alt="퀴즈를 설명하는 사자와 칠판"
          />

          <section className="quiz-question-panel">
            {loading ? (
              <div className="quiz-loading">
                오늘의 퀴즈를 불러오는 중...
              </div>
            ) : !question ? (
              <div className="quiz-loading">
                {message || '퀴즈가 준비되지 않았어요.'}
              </div>
            ) : (
              <>
                {/* Question Header */}
                <div className="quiz-question-panel__heading">
                  <span>
                    {quizSet?.region.name} 지역 퀴즈
                  </span>

                  <strong>
                    {currentIndex + 1} / {questions.length}
                  </strong>
                </div>

                {/* Question */}
                <h2 className="quiz-question">
                  {question.question}
                </h2>

                {/* Choices */}
                <div className="quiz-choices">
                  {question.choices.map((choice, index) => {
                    const selected =
                      answers[question.order_no] === index;

                    const answerResult = result?.answers.find(
                      (item) =>
                        item.order_no === question.order_no,
                    );

                    const correct =
                      completed &&
                      answerResult?.answer_index === index;

                    return (
                      <button
                        key={index}
                        type="button"
                        className={[
                          'quiz-choice',
                          selected &&
                            'quiz-choice--selected',
                          correct &&
                            'quiz-choice--correct',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        disabled={completed || submitting}
                        aria-pressed={selected}
                        onClick={() => selectAnswer(index)}
                      >
                        <span className="quiz-choice__index">
                          {index + 1}
                        </span>

                        <span className="quiz-choice__text">
                          {choice}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation */}
                <div className="quiz-progress">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() =>
                      setCurrentIndex((index) => index - 1)
                    }
                  >
                    ‹ 이전
                  </button>

                  <span>
                    {completed
                      ? '오늘 참여 완료'
                      : `${answeredCount} / ${questions.length} 답변 완료`}
                  </span>

                  <button
                    type="button"
                    disabled={
                      currentIndex === questions.length - 1
                    }
                    onClick={() =>
                      setCurrentIndex((index) => index + 1)
                    }
                  >
                    다음 ›
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="button"
                  className="quiz-primary-button"
                  disabled={
                    !completed &&
                    (!allAnswered || submitting)
                  }
                  onClick={() => {
                    if (completed) {
                      openResultPopup();
                    } else {
                      void submitQuiz();
                    }
                  }}
                >
                  {completed
                    ? '오늘 참여 완료 · 결과 보기'
                    : submitting
                      ? '제출 중...'
                      : '정답 제출'}
                </button>
              </>
            )}
          </section>

          {/* Error Message */}
          {message && question && (
            <p
              className="quiz-message"
              role="alert"
            >
              {message}
            </p>
          )}

          {/* Back */}
          <button
            type="button"
            className="quiz-return-button"
            onClick={onBack}
          >
            ‹ 탐험으로 돌아가기
          </button>
        </section>
      </div>

      {/* Game Menu */}
      {menuOpen && (
        <GameMenu
          onClose={() => setMenuOpen(false)}
          onOpenMap={() => {
            setMenuOpen(false);
            onOpenMap();
          }}
          onOpenQuiz={() => setMenuOpen(false)}
          onNotice={setMessage}
        />
      )}

      {/* Quiz Result Popup */}
      {popupType && (
        <QuizPopup
          type={popupType}
          result={result}
          questions={questions}
          onClose={() => setPopupType(null)}
        />
      )}
    </main>
  );
}
