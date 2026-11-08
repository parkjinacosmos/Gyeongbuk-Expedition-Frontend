import './GoldDisplay.css';

interface GoldDisplayProps {
  className?: string;
  gold?: number | null;
  goldImage: string;
  plusImage: string;
  onAddGold: () => void;
}

export default function GoldDisplay({
  className = '',
  gold,
  goldImage,
  plusImage,
  onAddGold,
}: GoldDisplayProps) {
  return (
    <div className={`gold-display ${className}`}>
      <img src={goldImage} alt="골드" />

      <strong>{(gold ?? 0).toLocaleString()}</strong>
      <button
        type="button"
        className="gold-display__add"
        onClick={onAddGold}
        aria-label="골드 충전"
      >
        <img src={plusImage} alt="" />
      </button>
    </div>
  );
}
