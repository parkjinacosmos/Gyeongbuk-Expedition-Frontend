/**
 * Shop API
 * GET /products
 * GET /products/:product_id
 */

export type ProductStatus = 'ACTIVE' | 'PREPARING';

export interface ShopRegion {
  id: number;
  code: string;
  name: string;
}

export interface ShopProduct {
  id: number;
  name: string;
  image_url: string | null;
  region: ShopRegion;
  specialty_id: number | null;
  seller_name: string | null;
  price: number | null;
  status: ProductStatus;
}

export interface ShopListResponse {
  items: ShopProduct[];
}

export interface ShopProductDetail extends ShopProduct {
  description: string | null;
  external_url: string | null;
  link_available: boolean;
  updated_at: string;
}

export interface ShopFilters {
  regionId?: number;
  specialtyId?: number;
}

interface ErrorResponse {
  code?: string;
  message?: string;
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:3000/api/v1'
).replace(/\/$/, '');

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK_API !== 'false';

async function request<T>(path: string): Promise<T> {
  const token = localStorage.getItem('access_token');

  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error: ErrorResponse | null =
      await response.json().catch(() => null);

    if (response.status === 401) {
      localStorage.removeItem('access_token');
    }

    throw new Error(
      error?.message ?? '상품 정보를 불러오지 못했어요.',
    );
  }

  return response.json() as Promise<T>;
}

const mockProducts: ShopProductDetail[] = [
  {
    id: 1,
    name: '청송 사과',
    image_url: null,
    region: { id: 1, code: 'R01', name: '청송' },
    specialty_id: 1,
    seller_name: '테스트 상품',
    price: null,
    status: 'PREPARING',
    description: null,
    external_url: null,
    link_available: false,
    updated_at: '2026-11-09T00:00:00',
  },
];

async function getMockProducts(
  filters: ShopFilters = {},
): Promise<ShopListResponse> {
  return {
    items: mockProducts.filter(
      (product) =>
        (filters.regionId === undefined ||
          product.region.id === filters.regionId) &&
        (filters.specialtyId === undefined ||
          product.specialty_id === filters.specialtyId),
    ),
  };
}

async function getMockDetail(
  productId: number,
): Promise<ShopProductDetail> {
  const product = mockProducts.find(
    (item) => item.id === productId,
  );

  if (!product) {
    throw new Error('조회할 상품이 없습니다.');
  }

  return product;
}

export const shopApi = {
  getProducts(
    filters: ShopFilters = {},
  ): Promise<ShopListResponse> {
    if (USE_MOCK) {
      return getMockProducts(filters);
    }

    const params = new URLSearchParams();

    if (filters.regionId !== undefined) {
      params.set('region_id', String(filters.regionId));
    }

    if (filters.specialtyId !== undefined) {
      params.set(
        'specialty_id',
        String(filters.specialtyId),
      );
    }

    const query = params.toString();

    return request<ShopListResponse>(
      `/products${query ? `?${query}` : ''}`,
    );
  },

  getDetail(
    productId: number,
  ): Promise<ShopProductDetail> {
    if (USE_MOCK) {
      return getMockDetail(productId);
    }

    return request<ShopProductDetail>(
      `/products/${productId}`,
    );
  },
};
