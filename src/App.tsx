
import { useEffect, useState } from 'react';

import ExplorePage from './pages/Explore/ExplorePage';
import GamePage from './pages/Game/GamePage';
import RegionInfoPage from './pages/RegionInfo/RegionInfoPage';

import BottomNavigation from './components/BottomNavigation/BottomNavigation';

import type { NavigationItem } from './components/BottomNavigation/BottomNavigation';

type ExploreScreen = 'map' | 'region-info' | 'game';

const ACTIVE_TAB_KEY = 'gyeongbuk-active-tab';
const EXPLORE_SCREEN_KEY = 'gyeongbuk-explore-screen';
const REGION_ID_KEY = 'gyeongbuk-selected-region';

const pageTitles: Record<
  Exclude<NavigationItem, 'explore'>,
  string
> = {
  character: '캐릭터',
  book: '도감',
  shop: '상점',
};

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
    // 저장소 사용 불가
  }

  return 'explore';
}

function getSavedExploreScreen(): ExploreScreen {
  try {
    const saved = localStorage.getItem(
      EXPLORE_SCREEN_KEY,
    );

    if (
      saved === 'map' ||
      saved === 'game' ||
      saved === 'region-info'
    ) {
      return saved;
    }
  } catch {
    // 저장소 사용 불가
  }

  return 'map';
}

function getSavedRegionId(): number {
  try {
    const saved = Number(
      localStorage.getItem(REGION_ID_KEY),
    );

    return saved === 1 || saved === 2 ? saved : 2;
  } catch {
    return 2;
  }
}

export default function App() {
  const [activeTab, setActiveTab] =
    useState<NavigationItem>(getSavedTab);

  const [exploreScreen, setExploreScreen] =
    useState<ExploreScreen>(getSavedExploreScreen);

  const [selectedRegionId, setSelectedRegionId] =
    useState(getSavedRegionId);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    } catch {
      // 저장 실패 시에도 정상 동작
    }
  }, [activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem(
        EXPLORE_SCREEN_KEY,
        exploreScreen,
      );
    } catch {
      // 저장 실패 시에도 정상 동작
    }
  }, [exploreScreen]);

  useEffect(() => {
    try {
      localStorage.setItem(
        REGION_ID_KEY,
        String(selectedRegionId),
      );
    } catch {
      // 저장 실패 시에도 정상 동작
    }
  }, [selectedRegionId]);

  const openMap = () => {
    setActiveTab('explore');
    setExploreScreen('map');
  };

  const openGame = () => {
    setActiveTab('explore');
    setExploreScreen('game');
  };

  const openRegionInfo = (regionId: number) => {
    // MVP에서는 R01, R02만 표시
    if (regionId !== 1 && regionId !== 2) {
      return;
    }

    setSelectedRegionId(regionId);
    setActiveTab('explore');
    setExploreScreen('region-info');
  };

  const handleTabChange = (tab: NavigationItem) => {
    setActiveTab(tab);
  };

  return (
    <>
      {activeTab === 'explore' ? (
        exploreScreen === 'map' ? (
          <ExplorePage
            onStartExplore={openGame}
            onOpenRegionInfo={openRegionInfo}
          />
        ) : exploreScreen === 'region-info' ? (
          <RegionInfoPage
            regionId={selectedRegionId}
            onBack={openMap}
            onStartExplore={openGame}
          />
        ) : (
          <GamePage onOpenMap={openMap} />
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
