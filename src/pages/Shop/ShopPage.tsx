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
import OptionSelection from './components/OptionSelection';
import DeliveryInfo from './components/DeliveryInfo';

import {
  mockOrchards,
  mockOptions,
  initialDeliveryForm,
  type Orchard,
  type DeliveryFormData,
} from './shopMock';

import backgroundImage from '../../assets/shop/background.png';
import merchantImage from '../../assets/shop/merchant.png';
import appleBasketImage from '../../assets/shop/apple-basket.png';

import './ShopPage.css';

// ========================================
// Types & Constants
// ========================================

type ShopStep =
  | 'main'
  | 'orchard'
  | 'option'
  | 'delivery';

const CHEONGSONG_REGION_ID = 1;

// ========================================
// Helpers
// ========================================

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : '상품 정보를 불러오지 못했어요.';
}

// ========================================
// Shop Page
// ========================================

export default function ShopPage() {
  // 사용자 정보
  const [user, setUser] =
    useState<ExploreUser | null>(null);

  // 상품 정보
  const [product, setProduct] =
    useState<ShopProduct | null>(null);

  const [detail, setDetail] =
    useState<ShopProductDetail | null>(null);

  // 로딩
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // 오류 및 알림
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // 메뉴
  const [menuOpen, setMenuOpen] = useState(false);

  // 재시도
  const [retryKey, setRetryKey] = useState(0);

  // 구매 화면
  const [step, setStep] = useState<ShopStep>('main');

  // 선택한 과수원
  const [selectedOrchard, setSelectedOrchard] =
    useState<Orchard | null>(null);

  // 선택한 상품 옵션
  const [selectedOptionId, setSelectedOptionId] =
    useState(mockOptions[0].id);

  // 수량
  const [quantity, setQuantity] = useState(1);

  // 배송 정보
  const [deliveryForm, setDeliveryForm] =
    useState<DeliveryFormData>({
      ...initialDeliveryForm,
    });

  // ========================================
  // 사용자 정보 API
  // ========================================

  useEffect(() => {
    let cancelled = false;

    exploreApi
      .getUser()
      .then((data) => {
        if (!cancelled) {
          setUser(data);
        }
      })
      .catch(() => {
        // 사용자 조회 실패가 상점 진입을 막지는 않음
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ========================================
  // 상품 목록 API
  // ========================================

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError('');
      setProduct(null);
      setDetail(null);

      try {
        const response = await shopApi.getProducts({
          regionId: CHEONGSONG_REGION_ID,
        });

        const appleProduct = response.items.find(
          (item) =>
            item.region.id === CHEONGSONG_REGION_ID &&
            item.name.includes('사과'),
        );

        if (!cancelled) {
          setProduct(appleProduct ?? null);
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

    void loadProduct();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  // ========================================
  // 구매 과정 초기화
  // ========================================

  function resetPurchaseFlow() {
    setStep('main');
    setSelectedOrchard(null);
    setSelectedOptionId(mockOptions[0].id);
    setQuantity(1);
    setDeliveryForm({ ...initialDeliveryForm });
  }

  // ========================================
  // 구매 버튼
  // ========================================

  async function handlePurchase() {
    if (loading || detailLoading) {
      return;
    }

    setError('');
    setNotice('');

    // 실제 상품이 없더라도 시연 화면 진입 가능
    if (!product) {
      setStep('orchard');
      return;
    }

    setDetailLoading(true);

    try {
      // 실제 상품 상세 API 호출
      const productDetail =
        detail?.id === product.id
          ? detail
          : await shopApi.getDetail(product.id);

      setDetail(productDetail);

      // 판매 상태와 관계없이 시연용 구매 화면 진입
      setStep('orchard');
    } catch (err) {
      // 상세 API 실패 시에도 시연 화면 제공
      setNotice(
        `${getErrorMessage(err)} 시연용 화면으로 이동합니다.`,
      );

      setStep('orchard');
    } finally {
      setDetailLoading(false);
    }
  }

  // ========================================
  // 과수원 선택
  // ========================================

  function handleOrchardSelect(orchard: Orchard) {
    setSelectedOrchard(orchard);
    setSelectedOptionId(mockOptions[0].id);
    setQuantity(1);
    setStep('option');
  }

  // ========================================
  // 주문 시연 완료
  // ========================================

  function handleOrderComplete() {
    // 실제 주문 API 호출하지 않음
    resetPurchaseFlow();

    setNotice(
      '주문 시연이 완료되었어요! 실제 주문이나 결제는 진행되지 않았어요.',
    );
  }

  const selectedOption = mockOptions.find(
    (option) => option.id === selectedOptionId,
  );

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

        {/* 상점 제목 */}
        <div className="shop-page__title">
  <h1>
    {step === 'main'
      ? '상점'
      : step === 'orchard'
        ? '과수원 선택'
        : step === 'option'
          ? '옵션 선택'
          : '배송정보 입력'}
  </h1>
</div>

        {/* ========================================
            상점 콘텐츠 통합 스크롤
        ======================================== */}

        <div className="shop-page__scroll-content">
          {/* 공통 상인 이미지 */}
          <div className="shop-page__merchant">
            <img
              className="shop-page__merchant-image"
              src={merchantImage}
              alt="사과를 판매하는 상점"
            />
          </div>

          {/* ========================================
              상점 메인
          ======================================== */}

          {step === 'main' && (
            <section className="shop-page__main">
              <article className="shop-page__recommendation">
                <span className="shop-page__recommendation-label">
                  ★ 오늘의 추천
                </span>

                <img
                  className="shop-page__apple-image"
                  src={product?.image_url || appleBasketImage}
                  alt="청송 사과 바구니"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = appleBasketImage;
                  }}
                />

                <div className="shop-page__recommendation-info">
                  <h2>청송 사과 바구니</h2>

                  <p className="shop-page__description">
                    청송의 신선한 사과를 만나보세요!
                  </p>

                  <span className="shop-page__seller">
                    {loading
                      ? '상품 조회 중...'
                      : error
                        ? '상품 정보를 불러오지 못했어요.'
                        : product?.seller_name ??
                          '판매처 준비 중'}
                  </span>
                </div>

                <button
                  className="shop-page__purchase-button"
                  type="button"
                  disabled={detailLoading}
                  onClick={() => void handlePurchase()}
                >
                  {detailLoading ? '확인 중' : '구매'}
                </button>
              </article>

              {/* 오류 및 재시도 */}
              {error && (
                <div
                  className="shop-page__error"
                  role="alert"
                >
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

          {step === 'orchard' && (
            <OrchardSelection
              orchards={mockOrchards}
              onSelect={handleOrchardSelect}
              onBack={resetPurchaseFlow}
            />
          )}

          {/* ========================================
              옵션 선택
          ======================================== */}

          {step === 'option' && selectedOrchard && (
            <OptionSelection
              orchard={selectedOrchard}
              options={mockOptions}
              selectedOptionId={selectedOptionId}
              quantity={quantity}
              onOptionChange={setSelectedOptionId}
              onQuantityChange={setQuantity}
              onNext={() => setStep('delivery')}
              onBack={() => setStep('orchard')}
            />
          )}

          {/* ========================================
              배송 정보
          ======================================== */}

          {step === 'delivery' &&
            selectedOrchard &&
            selectedOption && (
              <DeliveryInfo
                orchard={selectedOrchard}
                option={selectedOption}
                quantity={quantity}
                form={deliveryForm}
                onFormChange={setDeliveryForm}
                onComplete={handleOrderComplete}
                onBack={() => setStep('option')}
              />
            )}
        </div>

        {/* 알림 */}
        {notice && (
          <div
            className="shop-page__feedback"
            role="status"
          >
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
            setNotice(
              '퀴즈는 탐험 탭에서 이용해 주세요.',
            );
          }}
        />
      )}
    </main>
  );
}
