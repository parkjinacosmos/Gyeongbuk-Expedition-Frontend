import type { Orchard } from '../shopMock';
import { formatShopPrice } from '../shopMock';

import appleBasketImage from '../../../assets/shop/apple-basket.png';

interface OrchardSelectionProps {
  orchards: Orchard[];
  onSelect: (orchard: Orchard) => void;
  onBack: () => void;
}

export default function OrchardSelection({
  orchards,
  onSelect,
  onBack,
}: OrchardSelectionProps) {
  return (
    <section className="shop-flow" aria-label="과수원 선택">
      <div className="shop-flow__steps">
        <span className="shop-flow__step shop-flow__step--active">
          과수원 선택
        </span>
        <span className="shop-flow__arrow">›</span>
        <span className="shop-flow__step">옵션 선택</span>
        <span className="shop-flow__arrow">›</span>
        <span className="shop-flow__step">배송 정보</span>
      </div>

      <div className="shop-flow__list">
        {orchards.map((orchard) => (
          <article
            className="shop-flow__card"
            key={orchard.id}
          >
            <img
              className="shop-flow__image"
              src={appleBasketImage}
              alt=""
            />

            <div className="shop-flow__info">
              <h2>{orchard.name}</h2>
              <p>{orchard.location}</p>
              <p>{orchard.description}</p>
              <strong>
                {formatShopPrice(orchard.price)}
              </strong>
            </div>

            <button
              className="shop-flow__button shop-flow__button--card"
              type="button"
              onClick={() => onSelect(orchard)}
            >
              선택
            </button>
          </article>
        ))}
      </div>

      <button
        className="shop-flow__back"
        type="button"
        onClick={onBack}
      >
        ‹ 상점으로 돌아가기
      </button>
    </section>
  );
}
