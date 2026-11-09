import type {
  AppleOption,
  Orchard,
} from '../shopMock';

import { formatShopPrice } from '../shopMock';

import appleBasketImage from '../../../assets/shop/orchard-apple-basket.png';

interface OptionSelectionProps {
  orchard: Orchard;
  options: AppleOption[];
  selectedOptionId: string;
  quantity: number;
  onOptionChange: (id: string) => void;
  onQuantityChange: (quantity: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function OptionSelection({
  orchard,
  options,
  selectedOptionId,
  quantity,
  onOptionChange,
  onQuantityChange,
  onNext,
  onBack,
}: OptionSelectionProps) {
  const selectedOption = options.find(
    (option) => option.id === selectedOptionId,
  );

  const totalPrice =
    (orchard.price + (selectedOption?.additionalPrice ?? 0)) *
    quantity;

  return (
    <section className="shop-flow" aria-label="옵션 선택">
      <div className="shop-flow__steps">
        <span className="shop-flow__step">
          과수원 선택
        </span>
        <span className="shop-flow__arrow">›</span>
        <span className="shop-flow__step shop-flow__step--active">
          옵션 선택
        </span>
        <span className="shop-flow__arrow">›</span>
        <span className="shop-flow__step">
          배송 정보
        </span>
      </div>

      <div className="shop-flow__panel">
        <div className="shop-flow__product">
          <img src={appleBasketImage} alt="사과 바구니" />
          <div>
            <h2>{orchard.name}</h2>
            <p>청송 사과 바구니</p>
            <strong>{formatShopPrice(orchard.price)}부터</strong>
          </div>
        </div>

        <h3>상품 옵션 선택</h3>

        <div className="shop-flow__options">
          {options.map((option) => (
            <label
              className={`shop-flow__option ${
                selectedOptionId === option.id
                  ? 'shop-flow__option--selected'
                  : ''
              }`}
              key={option.id}
            >
              <input
                type="radio"
                name="apple-option"
                value={option.id}
                checked={selectedOptionId === option.id}
                onChange={() => onOptionChange(option.id)}
              />
              <span>
                {option.label} ({option.weight})
              </span>
              <strong>
                +{formatShopPrice(option.additionalPrice)}
              </strong>
            </label>
          ))}
        </div>

        <div className="shop-flow__quantity">
          <span>수량</span>

          <div className="shop-flow__counter">
            <button
              type="button"
              aria-label="수량 감소"
              disabled={quantity <= 1}
              onClick={() =>
                onQuantityChange(Math.max(1, quantity - 1))
              }
            >
              −
            </button>

            <strong>{quantity}</strong>

            <button
              type="button"
              aria-label="수량 증가"
              disabled={quantity >= 10}
              onClick={() =>
                onQuantityChange(Math.min(10, quantity + 1))
              }
            >
              +
            </button>
          </div>
        </div>

        <div className="shop-flow__total">
          <span>총 상품 금액</span>
          <strong>{formatShopPrice(totalPrice)}</strong>
        </div>

        <button
          className="shop-flow__button shop-flow__button--full"
          type="button"
          disabled={!selectedOption}
          onClick={onNext}
        >
          배송 정보 입력하기
        </button>
      </div>

      <button
        className="shop-flow__back"
        type="button"
        onClick={onBack}
      >
        ‹ 과수원 선택으로
      </button>
    </section>
  );
}
