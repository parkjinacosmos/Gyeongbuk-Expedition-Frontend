import type {
  AppleOption,
  DeliveryFormData,
  Orchard,
} from '../shopMock';

import { formatShopPrice } from '../shopMock';

interface DeliveryInfoProps {
  orchard: Orchard;
  option: AppleOption;
  quantity: number;
  form: DeliveryFormData;
  onFormChange: (form: DeliveryFormData) => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function DeliveryInfo({
  orchard,
  option,
  quantity,
  form,
  onFormChange,
  onComplete,
  onBack,
}: DeliveryInfoProps) {
  const totalPrice =
    (orchard.price + option.additionalPrice) * quantity;

  function updateField(
    key: keyof DeliveryFormData,
    value: string,
  ) {
    onFormChange({
      ...form,
      [key]: value,
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onComplete();
  }

  return (
    <section className="shop-flow" aria-label="배송 정보">
      <div className="shop-flow__steps">
        <span className="shop-flow__step">
          과수원 선택
        </span>
        <span className="shop-flow__arrow">›</span>
        <span className="shop-flow__step">
          옵션 선택
        </span>
        <span className="shop-flow__arrow">›</span>
        <span className="shop-flow__step shop-flow__step--active">
          배송 정보
        </span>
      </div>

      <form
        className="shop-flow__panel shop-flow__form"
        onSubmit={handleSubmit}
      >
        <h2>배송 정보 입력</h2>

        <label>
          받는 분
          <input
            type="text"
            value={form.recipient}
            onChange={(event) =>
              updateField('recipient', event.target.value)
            }
            placeholder="받는 분 성함"
            required
          />
        </label>

        <label>
          연락처
          <input
            type="tel"
            value={form.phone}
            onChange={(event) =>
              updateField('phone', event.target.value)
            }
            placeholder="010-0000-0000"
            pattern="01[016789]-?[0-9]{3,4}-?[0-9]{4}"
            required
          />
        </label>

        <label>
          우편번호
          <input
            type="text"
            value={form.postalCode}
            onChange={(event) =>
              updateField('postalCode', event.target.value)
            }
            placeholder="우편번호"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            required
          />
        </label>

        <label>
          주소
          <input
            type="text"
            value={form.address}
            onChange={(event) =>
              updateField('address', event.target.value)
            }
            placeholder="도로명 주소"
            required
          />
        </label>

        <label>
          상세 주소
          <input
            type="text"
            value={form.detailAddress}
            onChange={(event) =>
              updateField('detailAddress', event.target.value)
            }
            placeholder="동, 호수 등"
          />
        </label>

        <label>
          배송 요청 사항
          <textarea
            value={form.request}
            onChange={(event) =>
              updateField('request', event.target.value)
            }
            placeholder="배송 요청 사항을 입력해 주세요."
            rows={2}
          />
        </label>

        <div className="shop-flow__summary">
          <h3>주문 정보</h3>
          <p>과수원: {orchard.name}</p>
          <p>옵션: {option.label} ({option.weight})</p>
          <p>수량: {quantity}개</p>
          <div className="shop-flow__total">
            <span>총 금액</span>
            <strong>{formatShopPrice(totalPrice)}</strong>
          </div>
        </div>

        <p className="shop-flow__demo-notice">
          디자인 시연용 화면입니다. 실제 결제 및 배송은
          진행되지 않습니다.
        </p>

        <button
          className="shop-flow__button shop-flow__button--full"
          type="submit"
        >
          주문 시연 완료
        </button>
      </form>

      <button
        className="shop-flow__back"
        type="button"
        onClick={onBack}
      >
        ‹ 옵션 선택으로
      </button>
    </section>
  );
}
