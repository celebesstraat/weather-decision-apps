import React from 'react';
import { hapticFeedback } from '../utils/hapticFeedback';

interface FavoritesDisplayProps {
  favorites: string[];
  homeLocation: string;
  onSelectFavorite: (location: string) => void;
  onSetAsHome: (location: string) => void;
  onRemoveFavorite: (location: string) => void;
  isLoading: boolean;
}

const FavoritesDisplay: React.FC<FavoritesDisplayProps> = ({
  favorites,
  homeLocation,
  onSelectFavorite,
  onSetAsHome,
  onRemoveFavorite,
  isLoading
}) => {
  if (favorites.length === 0) {
    return null;
  }

  const handleSelectFavorite = (location: string) => {
    hapticFeedback.onSelect();
    onSelectFavorite(location);
  };

  const handleSetAsHome = (e: React.MouseEvent, location: string) => {
    e.stopPropagation();
    onSetAsHome(location);
  };

  const handleRemoveFavorite = (e: React.MouseEvent, location: string) => {
    e.stopPropagation();
    onRemoveFavorite(location);
  };

  return (
    <div className="max-w-md mx-auto mt-4">
      <h3 className="text-sm font-semibold text-slate-600 mb-2 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
        Your Favorites
      </h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {favorites.map((favorite) => {
          const isHome = homeLocation === favorite;
          
          return (
            <div key={favorite} className="group relative">
              <button
                onClick={() => handleSelectFavorite(favorite)}
                disabled={isLoading}
                className={`bg-white/30 backdrop-blur-lg text-slate-700 font-semibold py-2 px-4 rounded-full text-sm hover:bg-white/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  isHome ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''
                }`}
                title={isHome ? `${favorite} (Home)` : favorite}
              >
                {isHome && <span className="text-blue-600">🏠</span>}
                <span>{favorite}</span>
              </button>
              
              {/* Action buttons that appear on hover */}
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {!isHome && (
                  <button
                    onClick={(e) => handleSetAsHome(e, favorite)}
                    disabled={isLoading}
                    className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Set ${favorite} as home`}
                    title="Set as Home"
                  >
                    🏠
                  </button>
                )}
                <button
                  onClick={(e) => handleRemoveFavorite(e, favorite)}
                  disabled={isLoading}
                  className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Remove ${favorite} from favorites`}
                  title="Remove from favorites"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {homeLocation && (
        <p className="text-xs text-slate-500 text-center mt-2">
          🏠 Home: <span className="font-medium text-slate-600">{homeLocation}</span>
        </p>
      )}
    </div>
  );
};

export default FavoritesDisplay;