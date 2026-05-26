import { Star } from 'lucide-react';

interface FavoriteButtonProps {
  favorite: boolean;
  onClick: () => void;
}

export function FavoriteButton({ favorite, onClick }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
      className={`rounded-app p-2 transition ${
        favorite ? 'text-amber-500 hover:bg-amber-50' : 'text-muted hover:bg-surface hover:text-amber-500'
      }`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Star size={20} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  );
}
