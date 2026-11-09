import type { CSSProperties } from 'react';

import cheongsong from '../../assets/regions/backgrounds/cheongsong.png';
import andong from '../../assets/regions/backgrounds/andong.png';
import yeongju from '../../assets/regions/backgrounds/yeongju.png';
import mungyeong from '../../assets/regions/backgrounds/mungyeong.png';
import sangju from '../../assets/regions/backgrounds/sangju.png';
import seongju from '../../assets/regions/backgrounds/seongju.png';
import uiseong from '../../assets/regions/backgrounds/uiseong.png';
import pohang from '../../assets/regions/backgrounds/pohang.png';

interface BackgroundArtwork {
  image: string;
  width: number;
  height: number;
  roadTop: number;
  roadBottom: number;
}

// The road bounds are measured in source pixels at the grass-to-road transitions.
const REGION_BACKGROUNDS: Readonly<Record<number, BackgroundArtwork>> = {
  1: { image: cheongsong, width: 446, height: 968, roadTop: 433, roadBottom: 609 },
  2: { image: andong, width: 446, height: 952, roadTop: 425, roadBottom: 606 },
  3: { image: yeongju, width: 446, height: 952, roadTop: 425, roadBottom: 605 },
  4: { image: mungyeong, width: 446, height: 952, roadTop: 425, roadBottom: 606 },
  5: { image: sangju, width: 446, height: 952, roadTop: 424, roadBottom: 605 },
  6: { image: seongju, width: 446, height: 952, roadTop: 425, roadBottom: 605 },
  7: { image: uiseong, width: 446, height: 952, roadTop: 425, roadBottom: 606 },
  8: { image: pohang, width: 446, height: 952, roadTop: 424, roadBottom: 606 },
};

const artwork = Object.values(REGION_BACKGROUNDS);
const roadDepth = ({ roadTop, roadBottom }: BackgroundArtwork) => roadBottom - roadTop;

// Use the same minimum road depth in every region while covering the full viewport.
const coverRatios = {
  '--road-per-width': Math.max(...artwork.map((bg) => roadDepth(bg) / bg.width)),
  '--road-per-upper': Math.max(...artwork.map((bg) => roadDepth(bg) / bg.roadTop)),
  '--road-per-lower': Math.max(...artwork.map((bg) => roadDepth(bg) / (bg.height - bg.roadTop))),
};

export function regionBackgroundStyle(regionId: number): CSSProperties {
  const bg = REGION_BACKGROUNDS[regionId] ?? REGION_BACKGROUNDS[1];

  return {
    ...coverRatios,
    '--region-background': 'url("' + bg.image + '")',
    '--artwork-ratio': bg.width / bg.height,
    '--artwork-road-start': bg.roadTop / bg.height,
    '--artwork-road-depth': roadDepth(bg) / bg.height,
  } as CSSProperties;
}
