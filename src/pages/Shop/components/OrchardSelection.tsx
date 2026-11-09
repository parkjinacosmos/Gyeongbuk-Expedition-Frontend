import type { ShopProduct } from '../../../api/shop';

import appleBasketImage from '../../../assets/shop/apple-basket.png';

interface OrchardSelectionProps {
  products: ShopProduct[];
  loading: boolean;
  error: string;
  onBack: () => void;
  onRetry: () => void;
  onSelect: (product: ShopProduct) => void;
}

export default function OrchardSelection({
  products,
  loading,
  error,
  onBack,
  onRetry,
  onSelect,
}: OrchardSelectionProps) {
  return (
    <section
      className="shop-orchard"
      aria-label="과수원 선택"
    >
      {/* 진행 단계 */}
      <div className="shop-orchard__steps">
        <span className="shop-orchard__step shop-orchard__step--active">
          과수원 선택
        </span>

        <span
          className="shop-orchard__arrow"
          aria-hidden="true"
        >
          ›
        </span>

        <span className="shop-orchard__step">
          옵션 선택
        </span>

        <span className="shop-orchard__step">
          배송 정보
        </span>
      </div>

      {/* 과수원 목록 */}
      <div className="shop-orchard__list">
        {loading ? (
          <div
            className="shop-orchard__empty"
            role="status"
          >
            과수원 상품을 불러오는 중이에요.
          </div>
        ) : error ? (
          <div
            className="shop-orchard__empty"
            role="alert"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={onRetry}
            >
              재시도
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="shop-orchard__empty">
            <p>등록된 사과 상품이 없어요.</p>
          </div>
        ) : (
          products.map((product) => (
            <article
              className="shop-orchard__card"
              key={product.id}
            >
              <img
                className="shop-orchard__image"
                src={
                  product.image_url ||
                  appleBasketImage
                }
                alt={product.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    appleBasketImage;
                }}
              />

              <div className="shop-orchard__info">
                <h2>
                  {product.seller_name ||
                    `${product.region.name} 사과`}
                </h2>

                <p>{product.name}</p>

                <span className="shop-orchard__status">
                  🍎{' '}
                  {product.status === 'ACTIVE'
                    ? '판매 중'
                    : '판매 준비 중'}
                </span>
              </div>

              <button
                className="shop-orchard__select"
                type="button"
                disabled={
                  product.status !== 'ACTIVE'
                }
                onClick={() => onSelect(product)}
              >
                {product.status === 'ACTIVE'
                  ? '선택하기'
                  : '준비 중'}
              </button>
            </article>
          ))
        )}
      </div>

      <button
        className="shop-orchard__back"
        type="button"
        onClick={onBack}
      >
        ‹ 상점으로 돌아가기
      </button>
    </section>
  );
}
