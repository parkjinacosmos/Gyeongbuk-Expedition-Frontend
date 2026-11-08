import { useEffect, useState } from 'react';

import ExplorePage from './pages/Explore/ExplorePage';
import GamePage from './pages/Game/GamePage';
import RegionInfoPage from './pages/RegionInfo/RegionInfoPage';
import QuizPage from './pages/Quiz/QuizPage';

import BottomNavigation from './components/BottomNavigation/BottomNavigation';

import type { NavigationItem } from './components/BottomNavigation/BottomNavigation';

// ========================================
// Types
// ========================================

type ExploreScreen = 'map' | 'region-info' | 'game' | 'quiz';

type QuizReturnScreen = Exclude<ExploreScreen, 'quiz'>;

// ========================================
// LocalStorage Keys
// ========================================

const STORAGE_KEYS = {
  activeTab: 'gyeongbuk-active-tab',
  exploreScreen: 'gyeongbuk-explore-screen',
  selectedRegionId: 'gyeongbuk-selected-region',
  quizReturnScreen: 'gyeongbuk-quiz-return-screen',
} as const;

// ========================================
// Page Titles
// ========================================

const pageTitles: Record<
  Exclude<NavigationItem, 'explore'>,
  string
> = {
  character: '캐릭터',
  book: '도감',
  shop: '상점',
};

// ========================================
// Storage Helpers
// ========================================

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 저장소 사용 불가 시에도 앱은 정상 동작
  }
}

function isNavigationItem(
  value: string | null,
): value is NavigationItem {
  return (
    value === 'explore' ||
    value === 'character' ||
    value === 'book' ||
    value === 'shop'
  );
}

function isExploreScreen(
  value: string | null,
): value is ExploreScreen {
  return (
    value === 'map' ||
    value === 'region-info' ||
    value === 'game' ||
    value === 'quiz'
  );
}

function isQuizReturnScreen(
  value: string | null,
): value is QuizReturnScreen {
  return (
    value === 'map' ||
    value === 'region-info' ||
    value === 'game'
  );
}

// ========================================
// Initial State
// ========================================

function getSavedTab(): NavigationItem {
  const saved = readStorage(STORAGE_KEYS.activeTab);

  return isNavigationItem(saved) ? saved : 'explore';
}

function getSavedExploreScreen(): ExploreScreen {
  const saved = readStorage(STORAGE_KEYS.exploreScreen);

  return isExploreScreen(saved) ? saved : 'map';
}

function getSavedRegionId(): number {
  const saved = Number(
    readStorage(STORAGE_KEYS.selectedRegionId),
  );

  return saved === 1 || saved === 2 ? saved : 2;
}

function getSavedQuizReturn(): QuizReturnScreen {
  const saved = readStorage(STORAGE_KEYS.quizReturnScreen);

  return isQuizReturnScreen(saved) ? saved : 'game';
}

// ========================================
// App
// ========================================

export default function App() {
  const [activeTab, setActiveTab] =
    useState<NavigationItem>(getSavedTab);

  const [exploreScreen, setExploreScreen] =
    useState<ExploreScreen>(getSavedExploreScreen);

  const [selectedRegionId, setSelectedRegionId] =
    useState<number>(getSavedRegionId);

  const [quizReturnScreen, setQuizReturnScreen] =
    useState<QuizReturnScreen>(getSavedQuizReturn);

  // ========================================
  // Persist Navigation State
  // ========================================

  useEffect(() => {
    writeStorage(STORAGE_KEYS.activeTab, activeTab);
  }, [activeTab]);

  useEffect(() => {
    writeStorage(
      STORAGE_KEYS.exploreScreen,
      exploreScreen,
    );
  }, [exploreScreen]);

  useEffect(() => {
    writeStorage(
      STORAGE_KEYS.selectedRegionId,
      String(selectedRegionId),
    );
  }, [selectedRegionId]);

  useEffect(() => {
    writeStorage(
      STORAGE_KEYS.quizReturnScreen,
      quizReturnScreen,
    );
  }, [quizReturnScreen]);

  // ========================================
  // Navigation Helpers
  // ========================================

  const navigateExplore = (screen: ExploreScreen) => {
    setActiveTab('explore');
    setExploreScreen(screen);
  };

  const openMap = () => {
    navigateExplore('map');
  };

  const openGame = () => {
    navigateExplore('game');
  };

  const openQuiz = () => {
    if (exploreScreen !== 'quiz') {
      setQuizReturnScreen(exploreScreen);
    }

    navigateExplore('quiz');
  };

  const closeQuiz = () => {
    navigateExplore(quizReturnScreen);
  };

  const openRegionInfo = (regionId: number) => {
    // 현재 MVP 지원 지역
    if (regionId !== 1 && regionId !== 2) {
      return;
    }

    setSelectedRegionId(regionId);
    navigateExplore('region-info');
  };

  const handleTabChange = (tab: NavigationItem) => {
    setActiveTab(tab);
  };

  // ========================================
  // Render Explore Screen
  // ========================================

  const renderExploreScreen = () => {
    switch (exploreScreen) {
      case 'map':
        return (
          <ExplorePage
            onStartExplore={openGame}
            onOpenRegionInfo={openRegionInfo}
            onOpenQuiz={openQuiz}
          />
        );

      case 'region-info':
        return (
          <RegionInfoPage
            regionId={selectedRegionId}
            onBack={openMap}
            onStartExplore={openGame}
            onOpenQuiz={openQuiz}
          />
        );

      case 'quiz':
        return (
          <QuizPage
            onOpenMap={openMap}
            onBack={closeQuiz}
          />
        );

      case 'game':
        return (
          <GamePage
            onOpenMap={openMap}
            onOpenQuiz={openQuiz}
          />
        );

      default:
        return null;
    }
  };

  // ========================================
  // Render Placeholder Screen
  // ========================================

  const renderPlaceholderScreen = () => {
    if (activeTab === 'explore') {
      return null;
    }

    return (
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
    );
  };

  // ========================================
  // Render
  // ========================================

  return (
    <>
      {activeTab === 'explore'
        ? renderExploreScreen()
        : renderPlaceholderScreen()}

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </>
  );
}
