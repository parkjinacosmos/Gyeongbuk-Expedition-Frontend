
import { useEffect, useState } from 'react';

import ExplorePage from './pages/Explore/ExplorePage';
import GamePage from './pages/Game/GamePage';
import BottomNavigation from './components/BottomNavigation/BottomNavigation';

import type { NavigationItem } from './components/BottomNavigation/BottomNavigation';

type ExploreScreen = 'map' | 'game';

const ACTIVE_TAB_KEY = 'gyeongbuk-active-tab';
const EXPLORE_SCREEN_KEY = 'gyeongbuk-explore-screen';

const pageTitles: Record<
  Exclude<NavigationItem, 'explore'>,
  string
> = {
  character: '캐릭터',
  book: '도감',
  shop: '상점',
};

// 저장된 탭 불러오기
function getSavedTab(): NavigationItem {
  try {
    const saved = localStorage.getItem(ACTIVE_TAB_KEY);

    if (
      saved === 'explore' ||
      saved === 'character' ||
      saved === 'book' ||
      saved === 'shop'
    ) {
      return saved;
    }
  } catch {
    // 브라우저 저장소를 사용할 수 없는 경우
  }

  return 'explore';
}

// 저장된 탐험 화면 불러오기
function getSavedExploreScreen(): ExploreScreen {
  try {
    const saved = localStorage.getItem(
      EXPLORE_SCREEN_KEY,
    );

    return saved === 'game' ? 'game' : 'map';
  } catch {
    return 'map';
  }
}

function App() {
  // 마지막으로 선택한 하단 탭 유지
  const [activeTab, setActiveTab] =
    useState<NavigationItem>(getSavedTab);

  // 탐험 지도 / 게임 화면 유지
  const [exploreScreen, setExploreScreen] =
    useState<ExploreScreen>(
      getSavedExploreScreen,
    );

  // 탭 변경 시 브라우저에 저장
  useEffect(() => {
    try {
      localStorage.setItem(
        ACTIVE_TAB_KEY,
        activeTab,
      );
    } catch {
      // 저장 실패 시에도 화면 전환은 정상 동작
    }
  }, [activeTab]);

  // 탐험 화면 변경 시 브라우저에 저장
  useEffect(() => {
    try {
      localStorage.setItem(
        EXPLORE_SCREEN_KEY,
        exploreScreen,
      );
    } catch {
      // 저장 실패 시에도 화면 전환은 정상 동작
    }
  }, [exploreScreen]);

  // 지역 지도 열기
  const openMap = () => {
    setActiveTab('explore');
    setExploreScreen('map');
  };

  // 게임 화면 입장
  const openGame = () => {
    setActiveTab('explore');
    setExploreScreen('game');
  };

  // 하단 네비게이션 탭 변경
  const handleTabChange = (tab: NavigationItem) => {
    setActiveTab(tab);

    // 탐험 탭으로 돌아올 때는
    // 마지막 탐험 화면(map 또는 game)을 유지
  };

  return (
    <>
      {activeTab === 'explore' ? (
        exploreScreen === 'map' ? (
          <ExplorePage
            onStartExplore={openGame}
          />
        ) : (
          <GamePage
            onOpenMap={openMap}
          />
        )
      ) : (
        <main
          style={{
            minHeight: '100dvh',
            padding: '120px 20px 140px',
            background: '#f9f2dc',
            color: '#54371f',
            textAlign: 'center',
          }}
        >
          <h1>{pageTitles[activeTab]}</h1>
          <p>화면을 준비 중이에요.</p>
        </main>
      )}

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </>
  );
}

export default App;
