
import { useState } from 'react';
import './ExplorePage.css';

import appleImage from '../../assets/explore/apple.png';
import mackerelImage from '../../assets/explore/mackerel.png';
import ginsengImage from '../../assets/explore/ginseng.png';
import omijaImage from '../../assets/explore/omija.png';
import persimmonImage from '../../assets/explore/persimmon.png';
import melonImage from '../../assets/explore/melon.png';
import garlicImage from '../../assets/explore/garlic.png';
import gwamegiImage from '../../assets/explore/gwamegi.png';

import goldImage from '../../assets/explore/gold.png';
import lockImage from '../../assets/explore/lock.png';
import mapBackground from '../../assets/explore/map-background.png';
import mapIcon from '../../assets/explore/map-icon.png';
import menuImage from '../../assets/explore/menu.png';
import plusImage from '../../assets/explore/plus.png';
import profileImage from '../../assets/explore/profile.png';

type RegionStatus = 'current' | 'unlocked' | 'locked';

type Region = {
  id: number;
  name: string;
  product: string;
  image: string;
  requirement: string;
  status: RegionStatus;
  x: number;
  y: number;
};

const regions: Region[] = [
  {
    id: 1,
    name: '청송',
    product: '사과',
    image: appleImage,
    requirement: '현재 지역',
    status: 'current',
    x: 60,
    y: 8,
  },
  {
    id: 2,
    name: '안동',
    product: '간고등어',
    image: mackerelImage,
    requirement: '해금 완료',
    status: 'unlocked',
    x: 208,
    y: 8,
  },
  {
    id: 3,
    name: '영주',
    product: '풍기인삼',
    image: ginsengImage,
    requirement: '간고등어 조각 20개',
    status: 'locked',
    x: 255,
    y: 116,
  },
  {
    id: 4,
    name: '문경',
    product: '오미자',
    image: omijaImage,
    requirement: '인삼 조각 20개',
    status: 'locked',
    x: 116,
    y: 116,
  },
  {
    id: 5,
    name: '상주',
    product: '곶감',
    image: persimmonImage,
    requirement: '오미자 조각 20개',
    status: 'locked',
    x: 61,
    y: 224,
  },
  {
    id: 6,
    name: '성주',
    product: '참외',
    image: melonImage,
    requirement: '곶감 조각 20개',
    status: 'locked',
    x: 204,
    y: 224,
  },
  {
    id: 7,
    name: '의성',
    product: '마늘',
    image: garlicImage,
    requirement: '참외 조각 20개',
    status: 'locked',
    x: 81,
    y: 332,
  },
  {
    id: 8,
    name: '포항',
    product: '과메기',
    image: gwamegiImage,
    requirement: '마늘 조각 20개',
    status: 'locked',
    x: 219,
    y: 332,
  },
];

export default function ExplorePage() {
  const [selectedId, setSelectedId] = useState(1);
  const [currentId, setCurrentId] = useState(1);
  const [notice, setNotice] = useState('');

  const selectedRegion =
    regions.find((region) => region.id === selectedId) ??
    regions[0];

  const currentRegion =
    regions.find((region) => region.id === currentId) ??
    regions[0];

  const isCurrent = selectedRegion.id === currentId;
  const isLocked = selectedRegion.status === 'locked';

  const handleRegionSelect = () => {
    if (isLocked) {
      setNotice(`${selectedRegion.requirement}가 필요해요.`);
      return;
    }

    if (isCurrent) {
      setNotice('이미 탐험 중인 지역이에요.');
      return;
    }

    setCurrentId(selectedRegion.id);
    setNotice(
      `${selectedRegion.name} 지역으로 탐험을 변경했어요!`,
    );
  };

  return (
    <main className="explore-page">
      <div className="explore-page__content">
        <img
          className="explore-page__background"
          src={mapBackground}
          alt=""
        />

        <header className="explore-header">
          <div className="explore-header__profile">
            <img src={profileImage} alt="" />
            <div>
              <strong>Lv.3</strong>
              <span>새싹 원정대원</span>
            </div>
          </div>

          <div className="explore-header__location">
            <span>현재 지역 1-{currentId + 2}</span>
            <strong>
              <img src={currentRegion.image} alt="" />
              {currentRegion.name} {currentRegion.product}
            </strong>
            <small>경북 원정대 탐험 중</small>
          </div>

          <div className="explore-header__gold">
            <img src={goldImage} alt="" />
            <strong>640</strong>
            <button
              type="button"
              aria-label="골드 추가"
              onClick={() =>
                setNotice('골드 충전 기능은 준비 중이에요.')
              }
            >
              <img src={plusImage} alt="" />
            </button>
          </div>

          <button
            type="button"
            className="explore-header__menu"
            aria-label="메뉴 열기"
            onClick={() =>
              setNotice('메뉴 기능은 준비 중이에요.')
            }
          >
            <img src={menuImage} alt="" />
          </button>
        </header>

        <div className="explore-title">
          <div className="explore-title__inner" />
          <img src={mapIcon} alt="" />
          <h1>탐험 지도</h1>
        </div>

        <section
          className="explore-map"
          aria-label="경북 탐험 지도"
        >
          <svg
            className="explore-map__route"
            viewBox="0 0 402 432"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M123 55 C175 37 270 48 273 100
                 S310 150 317 161
                 S226 177 181 166
                 S100 213 125 261
                 S270 251 267 273
                 S145 327 146 377
                 S272 368 282 381"
              fill="none"
              stroke="#f1de60"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="2 14"
            />
          </svg>

          {regions.map((region) => {
            const active = region.id === currentId;
            const selected = region.id === selectedId;
            const locked = region.status === 'locked';

            return (
              <button
                key={region.id}
                type="button"
                className={[
                  'explore-region',
                  active && 'explore-region--current',
                  selected && 'explore-region--selected',
                  locked && 'explore-region--locked',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  left: `${(region.x / 402) * 100}%`,
                  top: `${region.y}px`,
                }}
                onClick={() => {
                  setSelectedId(region.id);
                  setNotice('');
                }}
                aria-pressed={selected}
                aria-label={`${region.name} ${region.product}, ${region.requirement}`}
              >
                <span className="explore-region__code">
                  R{String(region.id).padStart(2, '0')}
                </span>

                <img
                  className="explore-region__icon"
                  src={region.image}
                  alt=""
                />

                <strong className="explore-region__name">
                  {region.name} {region.product}
                </strong>

                <span className="explore-region__status">
                  {active
                    ? '현재 지역'
                    : locked
                      ? region.requirement
                      : '✓ 해금 완료'}
                </span>

                {locked && (
                  <img
                    className="explore-region__lock"
                    src={lockImage}
                    alt=""
                  />
                )}
              </button>
            );
          })}
        </section>

        <section
          className="explore-detail"
          aria-label="선택 지역 정보"
        >
          <div className="explore-detail__inner" />

          <img
            className="explore-detail__icon"
            src={selectedRegion.image}
            alt=""
          />

          <div className="explore-detail__info">
            <h2>
              {selectedRegion.name} · {selectedRegion.product}
            </h2>
            <p>
              {isLocked
                ? selectedRegion.requirement
                : '골드/분 5 · EXP/분 1'}
            </p>
          </div>

          <div className="explore-detail__actions">
            <span>
              {isCurrent
                ? '현재 탐험 중'
                : isLocked
                  ? '잠긴 지역'
                  : '탐험 가능'}
            </span>

            <button
              type="button"
              onClick={handleRegionSelect}
            >
              지역 선택 ›
            </button>
          </div>
        </section>

        {notice && (
          <div className="explore-notice" role="status">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice('')}
              aria-label="알림 닫기"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
