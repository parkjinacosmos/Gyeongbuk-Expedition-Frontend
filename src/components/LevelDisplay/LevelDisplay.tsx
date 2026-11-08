import './LevelDisplay.css';

interface LevelDisplayProps {
  className?: string;
  level?: number | null;
  name?: string | null;
  profileImage: string;
}

export default function LevelDisplay({
  className = '',
  level,
  name,
  profileImage,
}: LevelDisplayProps) {
  return (
    <div className={`level-display ${className}`}>
      <img src={profileImage} alt="프로필" />

      <div>
        <strong>Lv.{level ?? 1}</strong>
        <span>{name ?? '원정대원'}</span>
      </div>
    </div>
  );
}
