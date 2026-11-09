import { useState } from 'react';

import type { AppleOption, Orchard } from '../shopMock';
import { formatShopPrice } from '../shopMock';

import farmImage from '../../../assets/shop/farm.png';
import appleBasketImage from '../../../assets/shop/apple-basket.png';
import apple1kgImage from '../../../assets/shop/apple-1kg.png';
import apple2kgImage from '../../../assets/shop/apple-2kg.png';
import apple5kgImage from '../../../assets/shop/apple-5kg.png';
import giftWrapImage from '../../../assets/shop/gift-wrap.png';
import receiptImage from '../../../assets/shop/receipt.png';

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

const optionImages: Record<string, string> = {
  small: apple1kgImage,
  medium: apple2kgImage,
  large: apple5kgImage,
};

export default function OptionSelection({
  orchard,
  options,
  selectedOptionId,
  onOptionChange,
  onNext,
  onBack,
}: OptionSelectionProps) {
  const [giftWrapping, setGiftWrapping] = useState(true);

  const selectedOption = options.find(
    (option) => option.id === selectedOptionId,
  );

  const productPrice = selectedOption?.additionalPrice ?? 0;
  const wrappingPrice = giftWrapping ? 2000 : 0;
  const totalPrice = productPrice + wrappingPrice;

  return (
    <section
      className="shop-flow shop-option"
      aria-label="옵션 선택"
    >
      {/* 선택한 과수원 */}
      <div className="shop-option__farm shop-option__panel">
        <img
          className="shop-option__farm-image"
          src={farmImage}
          alt="사과 과수원"
        />

        <div className="shop-option__farm-info">
          <h2>{orchard.name}</h2>
          <p>{orchard.description}</p>
        </div>
      </div>

      {/* 용량 선택 */}
      <div className="shop-option__panel shop-option__capacity">
        <div className="shop-option__heading">
          <img src={appleBasketImage} alt="" />
          <h2>용량 선택</h2>
        </div>

        <div className="shop-option__capacity-list">
          {options.map((option) => {
            const isSelected = selectedOptionId === option.id;

            return (
              <label
                key={option.id}
                className={`shop-option__capacity-card ${
                  isSelected
                    ? 'shop-option__capacity-card--selected'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name="apple-capacity"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => onOptionChange(option.id)}
                />

                <span className="shop-option__radio" />

                <div className="shop-option__capacity-top">
                  <img
                    src={optionImages[option.id] ?? appleBasketImage}
                    alt=""
                  />
                  <strong>{option.weight.toUpperCase()}</strong>
                </div>

                <span className="shop-option__capacity-price">
                  {option.additionalPrice.toLocaleString('ko-KR')}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 포장 옵션 */}
      <div className="shop-option__panel shop-option__wrapping">
        <div className="shop-option__heading">
          <img src={giftWrapImage} alt="" />
          <h2>포장 옵션</h2>
        </div>

        <div className="shop-option__wrapping-row">
          <span>선물 포장 추가</span>
          <strong>+2,000</strong>

          <button
            type="button"
            className={`shop-option__toggle ${
              giftWrapping ? 'shop-option__toggle--active' : ''
            }`}
            role="switch"
            aria-checked={giftWrapping}
            aria-label="선물 포장 추가"
            onClick={() => setGiftWrapping((prev) => !prev)}
          >
            <span />
          </button>
        </div>
      </div>

      {/* 결제 금액 */}
      <div className="shop-option__panel shop-option__payment">
        <div className="shop-option__heading">
          <img src={receiptImage} alt="" />
          <h2>결제 금액</h2>
        </div>

        <div className="shop-option__payment-details">
          <div>
            <span>상품 금액</span>
            <strong>{formatShopPrice(productPrice)}</strong>
          </div>

          <div>
            <span>포장비</span>
            <strong>{formatShopPrice(wrappingPrice)}</strong>
          </div>
        </div>

        <div className="shop-option__payment-total">
          <span>총 결제금액</span>
          <strong>{formatShopPrice(totalPrice)}</strong>
        </div>

        <button
          className="shop-option__purchase"
          type="button"
          disabled={!selectedOption}
          onClick={onNext}
        >
          구매하기
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
