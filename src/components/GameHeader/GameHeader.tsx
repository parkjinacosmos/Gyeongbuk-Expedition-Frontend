import type { ReactNode } from 'react';
import type { ExploreUser } from '../../api/explore';

import LevelDisplay from '../LevelDisplay/LevelDisplay';
import GoldDisplay from '../GoldDisplay/GoldDisplay';

import profileImage from '../../assets/explore/profile.png';
import goldImage from '../../assets/explore/gold.png';
import plusImage from '../../assets/explore/plus.png';
import menuImage from '../../assets/explore/menu.png';

import './GameHeader.css';

interface GameHeaderProps {
  user: ExploreUser | null;
  regionImage: string;
  regionName: string;
  specialtyName?: string;
  variant?: 'explore' | 'game';
  menuOpen?: boolean;
  onOpenMenu: () => void;
  onAddGold: () => void;
  children?: ReactNode;
}

export default function GameHeader({
  user,
  regionImage,
  regionName,
  specialtyName,
  variant = 'explore',
  menuOpen = false,
  onOpenMenu,
  onAddGold,
  children,
}: GameHeaderProps) {
  return (
    <header className="game-header">
      <LevelDisplay
        className="game-header__profile"
        level={user?.level}
        name={user?.name ?? '원정대원'}
        profileImage={profileImage}
      />

      <div className="game-header__region">
        <span>
          현재 지역 {user?.cur_region.code ?? '—'}
        </span>

        <strong>
          <img src={regionImage} alt="" />
          {regionName}
          {variant === 'explore' && specialtyName
            ? ` ${specialtyName}`
            : ''}
        </strong>
      </div>

      <GoldDisplay
        className="game-header__gold"
        gold={user?.gold}
        goldImage={goldImage}
        plusImage={plusImage}
        onAddGold={onAddGold}
      />

      {children}

      <button
        type="button"
        className="game-header__menu"
        aria-label="메뉴 열기"
        aria-expanded={menuOpen}
        onClick={onOpenMenu}
      >
        <img src={menuImage} alt="" />
      </button>
    </header>
  );
}
