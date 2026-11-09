import { useEffect, useState } from 'react';

import {
  exploreApi,
  type ExploreUser,
} from '../../api/explore';

import {
  shopApi,
  type ShopProduct,
  type ShopProductDetail,
} from '../../api/shop';

import GameHeader from '../../components/GameHeader/GameHeader';
import GameMenu from '../../components/GameMenu/GameMenu';

import OrchardSelection from './components/OrchardSelection';

import backgroundImage from '../../assets/shop/background.png';
import merchantImage from '../../assets/shop/merchant.png';
import appleBasketImage from '../../assets/shop/apple-basket.png';

import './ShopPage.css';

type ShopView = 'main' | 'orchard';

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '상품 정보를 불러오지 못했어요.';
}

export default function ShopPage() {
  const [user, setUser] = useState<ExploreUser | null>(null);

  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<ShopProductDetail | null>(null);

  const [shopView, setShopView] = useState<ShopView>('main');

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // ========================================
  // 사용자 정보 조회
  // ========================================

  useEffect(() => {
    let cancelled = false;

    exploreApi.getUser()
      .then((data) => {
        if (!cancelled) {
          setUser(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotice('사용자 정보를 불러오지 못했어요.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ========================================
  // 전체 사과 상품 조회
  // ========================================

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError('');
      setProducts([]);

      try {
        const response = await shopApi.getProducts();

        const appleProducts = response.items.filter(
          (item) => item.name.includes('사과'),
        );

        if (!cancelled) {
          setProducts(appleProducts);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  // ========================================
  // 화면 전환
  // ========================================

  function handleOpenOrchard() {
    setNotice('');
    setShopView('orchard');
  }

  function handleBackToShop() {
    setNotice('');
    setSelectedProduct(null);
    setShopView('main');
  }

  // ========================================
  // 과수원 상품 선택 및 상세 조회
  // ========================================

  async function handleSelectOrchard(product: ShopProduct) {
    if (product.status !== 'ACTIVE' || detailLoading) {
      return;
    }

    setDetailLoading(true);
    setNotice('');

    try {
      const detail = await shopApi.getDetail(product.id);

      if (detail.status !== 'ACTIVE') {
        setNotice('현재 판매 준비 중인 상품이에요.');
        return;
      }

      setSelectedProduct(detail);

      // 옵션 선택 API가 아직 없으므로
      // 상세 정보만 조회하고 다음 화면 연결은 보류
      setNotice(
        `${detail.seller_name ?? detail.name} 상품을 선택했어요.`,
      );
    } catch (err) {
      setNotice(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }

  // ========================================
  // Render
  // ========================================

  return (
    <main className="shop-page">
      <div className="shop-page__content">
        {/* 배경 */}
        <img
          className="shop-page__background"
          src={backgroundImage}
          alt=""
          aria-hidden="true"
        />

        {/* 공통 상단바 */}
        <div className="shop-page__header">
          <GameHeader
            user={user}
            variant="character"
            menuOpen={menuOpen}
            onOpenMenu={() =>
              setMenuOpen((prev) => !prev)
            }
            onAddGold={() =>
              setNotice('골드 충전 기능은 준비 중이에요.')
            }
          />
        </div>

        {/* 제목 간판 */}
        <div
          className={`shop-page__title ${
            shopView === 'orchard'
              ? 'shop-page__title--wide'
              : ''
          }`}
        >
          <h1>
            {shopView === 'main'
              ? '상점'
              : '과수원 선택'}
          </h1>
        </div>

        {/* ========================================
            상점 메인
        ======================================== */}

        {shopView === 'main' && (
          <section className="shop-page__main">
            <img
              className="shop-page__merchant-image"
              src={merchantImage}
              alt="사과를 판매하는 상점"
            />

            <article className="shop-page__recommendation">
              <span className="shop-page__recommendation-label">
                ★ 오늘의 추천
              </span>

              <img
                className="shop-page__apple-image"
                src={appleBasketImage}
                alt="청송 사과 바구니"
              />

              <div className="shop-page__recommendation-info">
                <h2>청송 사과 바구니</h2>

                <p>
                  신선한 청송 사과를 과수원별로 비교하고
                  <br />
                  원하는 구성으로 주문해봐요!
                </p>
              </div>

              <button
                className="shop-page__purchase-button"
                type="button"
                onClick={handleOpenOrchard}
              >
                구매
              </button>
            </article>

            {error && (
              <div className="shop-page__error" role="alert">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() =>
                    setRetryKey((value) => value + 1)
                  }
                >
                  재시도
                </button>
              </div>
            )}
          </section>
        )}

        {/* ========================================
            과수원 선택
        ======================================== */}

        {shopView === 'orchard' && (
          <>
            <section className="shop-page__main">
              <img
                className="shop-page__merchant-image"
                src={merchantImage}
                alt="사과를 판매하는 상점"
              />
            </section>

            <OrchardSelection
              products={products}
              loading={loading}
              error={error}
              onBack={handleBackToShop}
              onRetry={() =>
                setRetryKey((value) => value + 1)
              }
              onSelect={(product) =>
                void handleSelectOrchard(product)
              }
            />
          </>
        )}

        {/* 선택 상품 알림 */}
        {selectedProduct && shopView === 'orchard' && (
          <div className="shop-page__selected-product">
            선택 상품: {selectedProduct.name}
          </div>
        )}

        {/* 알림 */}
        {notice && (
          <div className="shop-page__feedback" role="status">
            <span>{notice}</span>

            <button
              type="button"
              aria-label="알림 닫기"
              onClick={() => setNotice('')}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* 공통 메뉴 */}
      {menuOpen && (
        <GameMenu
          onClose={() => setMenuOpen(false)}
          onOpenMap={() => setMenuOpen(false)}
          onNotice={setNotice}
          onOpenQuiz={() => {
            setMenuOpen(false);
            setNotice('퀴즈는 탐험 탭에서 이용해 주세요.');
          }}
        />
      )}
    </main>
  );
}
