import { useState } from 'react';

import type {
  AppleOption,
  DeliveryFormData,
  Orchard,
} from '../shopMock';

import { formatShopPrice } from '../shopMock';

import appleBasketImage from '../../../assets/shop/apple-basket.png';
import nameImage from '../../../assets/shop/name.png';
import phoneImage from '../../../assets/shop/phone.png';
import postalCodeImage from '../../../assets/shop/postal-code.png';
import addressImage from '../../../assets/shop/address.png';
import detailAddressImage from '../../../assets/shop/detail-address.png';
import deliveryMemoImage from '../../../assets/shop/delivery-memo.png';
import paymentImage from '../../../assets/shop/payment.png';

interface DeliveryInfoProps {
  orchard: Orchard;
  option: AppleOption;
  quantity: number;
  giftWrapping: boolean;
  form: DeliveryFormData;
  onFormChange: (form: DeliveryFormData) => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function DeliveryInfo({
  orchard,
  option,
  quantity,
  giftWrapping,
  form,
  onFormChange,
  onComplete,
  onBack,
}: DeliveryInfoProps) {
  const [postalNotice, setPostalNotice] = useState(false);

  const productPrice = option.additionalPrice * quantity;
  const wrappingPrice = giftWrapping ? 2000 : 0;
  const totalPrice = productPrice + wrappingPrice;

  function updateField(
    key: keyof DeliveryFormData,
    value: string,
  ) {
    onFormChange({
      ...form,
      [key]: value,
    });
  }

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
  event.preventDefault();
  onComplete();
}

  return (
    <section
      className="shop-flow shop-delivery"
      aria-label="배송정보 입력"
    >
      {/* 주문 요약 카드 */}
      <article className="shop-delivery__summary">
        <span className="shop-delivery__summary-title">
          주문 요약
        </span>

        <img
          className="shop-delivery__apple"
          src={appleBasketImage}
          alt="사과 바구니"
        />

        <div className="shop-delivery__summary-details">
          <div className="shop-delivery__summary-row">
            <span>과수원</span>
            <strong>{orchard.name}</strong>
          </div>

          <div className="shop-delivery__summary-row">
            <span>상품</span>
            <strong>사과 {option.weight.toUpperCase()}</strong>
          </div>

          <div className="shop-delivery__summary-row">
            <span>옵션</span>
            <strong>
              {giftWrapping ? '선물포장 추가' : '기본 포장'}
            </strong>
          </div>

          <div className="shop-delivery__summary-total">
            <span>총 금액</span>
            <strong>{formatShopPrice(totalPrice)}</strong>
          </div>
        </div>
      </article>

      {/* 배송정보 입력 카드 */}
      <form
        className="shop-delivery__form"
        onSubmit={handleSubmit}
      >
        <div className="shop-delivery__fields">
          <label className="shop-delivery__field">
            <span className="shop-delivery__field-label">
              <img src={nameImage} alt="" />
              <span>이름</span>
            </span>

            <input
              type="text"
              autoComplete="name"
              value={form.recipient}
              onChange={(event) =>
                updateField('recipient', event.target.value)
              }
              placeholder="이름을 입력해주세요."
              required
            />
          </label>

          <label className="shop-delivery__field">
            <span className="shop-delivery__field-label">
              <img src={phoneImage} alt="" />
              <span>연락처</span>
            </span>

            <input
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) =>
                updateField('phone', event.target.value)
              }
              placeholder="연락처를 입력해주세요."
              pattern="01[016789]-?[0-9]{3,4}-?[0-9]{4}"
              required
            />
          </label>

          <div className="shop-delivery__field">
            <label
              className="shop-delivery__field-label"
              htmlFor="shop-delivery-postal"
            >
              <img src={postalCodeImage} alt="" />
              <span>우편번호</span>
            </label>

            <div className="shop-delivery__postal">
              <input
                id="shop-delivery-postal"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                value={form.postalCode}
                onChange={(event) =>
                  updateField(
                    'postalCode',
                    event.target.value.replace(/\D/g, '').slice(0, 5),
                  )
                }
                placeholder="우편번호 5자리 입력"
                pattern="[0-9]{5}"
                maxLength={5}
                required
              />

              <button
                className="shop-delivery__postal-button"
                type="button"
                onClick={() => setPostalNotice(true)}
              >
                우편번호 찾기
              </button>
            </div>
          </div>

          {postalNotice && (
            <p className="shop-delivery__postal-notice">
              디자인 시연용으로 우편번호를 직접 입력해주세요.
            </p>
          )}

          <label className="shop-delivery__field">
            <span className="shop-delivery__field-label">
              <img src={addressImage} alt="" />
              <span>주소</span>
            </span>

            <input
              type="text"
              autoComplete="street-address"
              value={form.address}
              onChange={(event) =>
                updateField('address', event.target.value)
              }
              placeholder="기본 주소를 입력해주세요."
              required
            />
          </label>

          <label className="shop-delivery__field">
            <span className="shop-delivery__field-label">
              <img src={detailAddressImage} alt="" />
              <span>상세주소</span>
            </span>

            <input
              type="text"
              value={form.detailAddress}
              onChange={(event) =>
                updateField('detailAddress', event.target.value)
              }
              placeholder="아파트 동/호수, 건물명을 입력해주세요."
            />
          </label>

          <label className="shop-delivery__field shop-delivery__field--memo">
            <span className="shop-delivery__field-label">
              <img src={deliveryMemoImage} alt="" />
              <span>배송메모</span>
            </span>

            <textarea
              value={form.request}
              onChange={(event) =>
                updateField('request', event.target.value)
              }
              placeholder={
                '배송관련 요청 사항을 입력해주세요.\nex. 부재 시 경비실에 맡겨주세요!'
              }
              rows={3}
            />
          </label>
        </div>

        {/* 결제 금액 */}
        <div className="shop-delivery__payment">
          <div className="shop-delivery__payment-label">
            <img src={paymentImage} alt="" />
            <span>총 결제 금액</span>
          </div>

          <strong>{formatShopPrice(totalPrice)}</strong>
        </div>

        {/* 디자인 시연 안내 - 유지 */}
        <p className="shop-flow__demo-notice">
          디자인 시연용 화면입니다. 실제 결제 및 배송은
          진행되지 않습니다.
        </p>

        <button
          className="shop-delivery__submit"
          type="submit"
        >
          주문하기
        </button>

        <button
          className="shop-delivery__back"
          type="button"
          onClick={onBack}
        >
          이전단계
        </button>
      </form>
    </section>
  );
}
