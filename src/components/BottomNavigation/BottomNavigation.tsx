import { useState } from 'react';
import './BottomNavigation.css';
import navigationIcons from '../../assets/navigation-icons.png';

export type NavigationItem =
  | 'explore'
  | 'character'
  | 'book'
  | 'shop';

interface BottomNavigationProps {
  activeTab?: NavigationItem;
  onTabChange?: (tab: NavigationItem) => void;
}

const navigationItems: {
  id: NavigationItem;
  label: string;
}[] = [
  { id: 'explore', label: '탐험' },
  { id: 'character', label: '캐릭터' },
  { id: 'book', label: '도감' },
  { id: 'shop', label: '상점' },
];

export default function BottomNavigation({
  activeTab,
  onTabChange,
}: BottomNavigationProps) {
  const [selectedTab, setSelectedTab] =
    useState<NavigationItem>('explore');

  const currentTab = activeTab ?? selectedTab;

  const handleTabChange = (tab: NavigationItem) => {
    if (activeTab === undefined) {
      setSelectedTab(tab);
    }
    onTabChange?.(tab);
  };

  return (
    <nav className="bottom-navigation" aria-label="하단 메뉴">
      <div className="bottom-navigation__menus">
        {navigationItems.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`bottom-navigation__item ${
              currentTab === id ? 'is-active' : ''
            }`}
            onClick={() => handleTabChange(id)}
            aria-current={currentTab === id ? 'page' : undefined}
          >
            <span
              className={`bottom-navigation__icon bottom-navigation__icon--${id}`}
            >
              <img src={navigationIcons} alt="" />
            </span>
            <span className="bottom-navigation__label">
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
