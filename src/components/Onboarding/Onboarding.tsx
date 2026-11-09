import { useState } from 'react';
import type { FormEvent } from 'react';

import { createCharacter } from '../../api/session';

import './Onboarding.css';

interface OnboardingProps {
  onCreated: () => void;
}

export default function Onboarding({ onCreated }: OnboardingProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await createCharacter(name.trim());
      onCreated();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : '캐릭터를 만들지 못했어요. 다시 시도해 주세요.',
      );
      setSubmitting(false);
    }
  };

  return (
    <main className="onboarding">
      <form className="onboarding__card" onSubmit={handleSubmit}>
        <img
          className="onboarding__character"
          src="/game/character.png"
          alt=""
        />
        <h1>경북 원정대</h1>
        <p>함께 탐험할 캐릭터의 이름을 지어 주세요.</p>

        <label className="onboarding__label" htmlFor="character-name">
          캐릭터 이름
        </label>
        <input
          id="character-name"
          value={name}
          maxLength={10}
          autoComplete="off"
          placeholder="한글, 영문, 숫자 2~10자"
          onChange={(event) => setName(event.target.value)}
        />

        {error && (
          <p className="onboarding__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting || !name.trim()}>
          {submitting ? '만드는 중...' : '탐험 시작하기'}
        </button>
      </form>
    </main>
  );
}
