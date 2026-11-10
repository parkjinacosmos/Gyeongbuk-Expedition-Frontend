import appleImage from './assets/explore/apple.png';
import mackerelImage from './assets/explore/mackerel.png';
import ginsengImage from './assets/explore/ginseng.png';
import omijaImage from './assets/explore/omija.png';
import persimmonImage from './assets/explore/persimmon.png';
import melonImage from './assets/explore/melon.png';
import garlicImage from './assets/explore/garlic.png';
import gwamegiImage from './assets/explore/gwamegi.png';

export const REGION_DESIGNS = [
  { id: 1, name: '청송', product: '사과', image: appleImage, x: 60, y: 8 },
  { id: 2, name: '안동', product: '간고등어', image: mackerelImage, x: 208, y: 8 },
  { id: 3, name: '영주', product: '풍기인삼', image: ginsengImage, x: 255, y: 116 },
  { id: 4, name: '문경', product: '오미자', image: omijaImage, x: 116, y: 116 },
  { id: 5, name: '상주', product: '곶감', image: persimmonImage, x: 61, y: 224 },
  { id: 6, name: '성주', product: '참외', image: melonImage, x: 204, y: 224 },
  { id: 7, name: '의성', product: '마늘', image: garlicImage, x: 81, y: 332 },
  { id: 8, name: '포항', product: '과메기', image: gwamegiImage, x: 219, y: 332 },
];

export function getRegionDesign(regionId: number) {
  return REGION_DESIGNS.find((region) => region.id === regionId) ?? REGION_DESIGNS[0];
}
