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

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '잠시 후 다시 시도해 주세요.';
}

export default function QuizPage({
  onOpenMap,
  onBack,
}: QuizPageProps) {
  const [user, setUser] = useState<ExploreUser | null>(null);
  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [popupType, setPopupType] = useState<QuizPopupType | null>(
    null,
  );

  const [message, setMessage] = useState('');
  const submitKey = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadQuiz() {
      setLoading(true);
      setMessage('');

      try {
        const [player, issued] = await Promise.all([
          exploreApi.getUser(),
          quizApi.issue(),
        ]);

        if (!mounted) return;

        setUser(player);
        setQuizSet(issued.set);

        const initialAnswers: Record<number, number> = {};

        issued.set.questions.forEach((question) => {
          if (question.selected_index !== null) {
            initialAnswers[question.order_no] =
              question.selected_index;
          }
        });

        setAnswers(initialAnswers);

        if (issued.set.status === 'SUBMITTED') {
          setPopupType('completed');
        }
      } catch (error) {
        if (mounted) setMessage(getErrorMessage(error));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadQuiz();

    return () => {
      mounted = false;
    };
  }, []);

  const questions = quizSet?.questions ?? [];
  const question = questions[currentIndex];

  const completed = quizSet?.status === 'SUBMITTED';
  const result = quizSet?.result ?? null;
 
  const answeredCount = questions.filter(
    (item) => answers[item.order_no] !== undefined,
  ).length;

  const allAnswered =
    questions.length === 3 && answeredCount === 3;

  function selectAnswer(index: number) {
    if (!question || completed) return;

    setAnswers((previous) => ({
      ...previous,
      [question.order_no]: index,
    }));
  }

  function openResultPopup() {
    if (!result) {
      setMessage('퀴즈 결과를 불러오지 못했어요.');
      return;
    }

    setPopupType(
      result.correct_count === result.total
        ? 'correct'
        : 'incorrect',
    );
  }

  async function submitQuiz() {
    if (!quizSet || !allAnswered || completed || submitting) {
      return;
    }

    setSubmitting(true);
    setMessage('');

    const key = submitKey.current ?? crypto.randomUUID();
    submitKey.current = key;

    try {
      const response = await quizApi.submit(
        quizSet.set_id,
        questions.map((item) => ({
          order_no: item.order_no,
          selected_index: answers[item.order_no],
        })),
        key,
      );

      setQuizSet(response.set);
      submitKey.current = null;

      const submittedResult = response.set.result;

      if (submittedResult) {
        setPopupType(
          submittedResult.correct_count ===
            submittedResult.total
            ? 'correct'
            : 'incorrect',
        );
      } else {
        setMessage(
          '제출은 완료되었지만 결과를 불러오지 못했어요.',
        );
      }

      // 서버 연결 전 개발용 응답의 유저 정보 갱신
      try {
        setUser(await exploreApi.getUser());
      } catch {
        // 결과 표시는 유지
      }
    } catch (error) {
      const code =
        error &&
        typeof error === 'object' &&
        'code' in error
          ? String(error.code)
          : '';

      if (code === 'QUIZ_ALREADY_SUBMITTED') {
        try {
          const latest = await quizApi.today();
          setQuizSet(latest);
          setPopupType('completed');
          submitKey.current = null;
        } catch {
          setMessage(getErrorMessage(error));
        }
      } else {
        setMessage(getErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="quiz-page">
      <div className="quiz-page__background" aria-hidden="true" />

      <div className="quiz-page__viewport">
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
                <div className="quiz-question-panel__heading">
                  <span>{quizSet?.region.name} 지역 퀴즈</span>
                  <strong>
                    {currentIndex + 1} / {questions.length}
                  </strong>
                </div>

                <h2 className="quiz-question">
                  {question.question}
                </h2>

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
                          selected && 'quiz-choice--selected',
                          correct && 'quiz-choice--correct',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        disabled={completed}
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
                      : `${answeredCount} / 3 답변 완료`}
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

                <button
                  type="button"
                  className="quiz-primary-button"
                  disabled={
                    !completed && (!allAnswered || submitting)
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

          {message && question && (
            <p className="quiz-message" role="alert">
              {message}
            </p>
          )}

          <button
            type="button"
            className="quiz-return-button"
            onClick={onBack}
          >
            ‹ 탐험으로 돌아가기
          </button>
        </section>
      </div>

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
