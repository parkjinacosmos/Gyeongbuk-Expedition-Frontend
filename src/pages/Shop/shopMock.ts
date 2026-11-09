export interface Orchard {
  id: number;
  name: string;
  location: string;
  description: string;
  price: number;
}

export interface AppleOption {
  id: string;
  label: string;
  weight: string;
  additionalPrice: number;
}

export interface DeliveryFormData {
  recipient: string;
  phone: string;
  postalCode: string;
  address: string;
  detailAddress: string;
  request: string;
}

export const mockOrchards: Orchard[] = [
  {
    id: 1,
    name: '청송 햇살 과수원',
    location: '경북 청송군',
    description: '햇살을 가득 받은 달콤한 청송 사과',
    price: 25000,
  },
  {
    id: 2,
    name: '청송 푸른 과수원',
    location: '경북 청송군',
    description: '아삭하고 신선한 청송 사과',
    price: 28000,
  },
  {
    id: 3,
    name: '청송 행복 과수원',
    location: '경북 청송군',
    description: '정성껏 재배한 산지 직송 사과',
    price: 30000,
  },
];


export const mockOptions: AppleOption[] = [
  {
    id: 'small',
    label: '1KG',
    weight: '1kg',
    additionalPrice: 18000,
  },
  {
    id: 'medium',
    label: '2KG',
    weight: '2kg',
    additionalPrice: 32000,
  },
  {
    id: 'large',
    label: '5KG',
    weight: '5kg',
    additionalPrice: 18000,
  },
];


export const initialDeliveryForm: DeliveryFormData = {
  recipient: '',
  phone: '',
  postalCode: '',
  address: '',
  detailAddress: '',
  request: '',
};

export function formatShopPrice(price: number): string {
  return `${price.toLocaleString('ko-KR')}원`;
}
