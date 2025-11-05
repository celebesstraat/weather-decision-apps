import type { Favorite } from '../types';

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    // Helper to simulate storage quota exceeded
    simulateQuotaExceeded: false,
    setQuotaExceeded: (value: boolean) => {
      mockLocalStorage.simulateQuotaExceeded = value;
    }
  };
})();

// Override localStorage for tests
Object.defineProperty(window, 'localStorage', {
  value: {
    ...mockLocalStorage,
    setItem: (key: string, value: string) => {
      if (mockLocalStorage.simulateQuotaExceeded) {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }
      mockLocalStorage.setItem(key, value);
    }
  }
});

// Favorites management functions (these would typically be in a separate service file)
const FAVORITES_KEY = 'get-the-washing-out-favorites';

const saveFavorites = (favorites: Favorite[]): void => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('Failed to save favorites:', error);
    throw error;
  }
};

const loadFavorites = (): Favorite[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Validate that result is an array
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error('Failed to load favorites:', error);
    return []; // Return empty array on corruption
  }
};

const addFavorite = (location: string, displayName: string): Favorite[] => {
  const favorites = loadFavorites();
  
  // Check for duplicates
  if (favorites.some(f => f.location.toLowerCase() === location.toLowerCase())) {
    return favorites; // Don't add duplicates
  }
  
  const newFavorite: Favorite = {
    id: Date.now().toString(),
    location,
    displayName,
    addedDate: new Date().toISOString()
  };
  
  const updatedFavorites = [...favorites, newFavorite];
  saveFavorites(updatedFavorites);
  return updatedFavorites;
};

const removeFavorite = (favoriteId: string): Favorite[] => {
  const favorites = loadFavorites();
  const updatedFavorites = favorites.filter(f => f.id !== favoriteId);
  saveFavorites(updatedFavorites);
  return updatedFavorites;
};

describe('localStorage Favorites Management', () => {
  beforeEach(() => {
    // Clear localStorage and reset quota simulation before each test
    mockLocalStorage.clear();
    mockLocalStorage.setQuotaExceeded(false);
    
    // Restore any mocked Date.now
    if (Date.now.mockRestore) {
      Date.now.mockRestore();
    }
  });

  describe('Basic Save/Load Functionality', () => {
    it('should save and load favorites correctly', () => {
      const testFavorites: Favorite[] = [
        {
          id: '1',
          location: 'Edinburgh',
          displayName: 'Edinburgh, Scotland',
          addedDate: '2024-01-01T00:00:00.000Z'
        }
      ];

      saveFavorites(testFavorites);
      const loaded = loadFavorites();

      expect(loaded).toEqual(testFavorites);
      expect(loaded).toHaveLength(1);
      expect(loaded[0].location).toBe('Edinburgh');
    });

    it('should return empty array when no favorites exist', () => {
      const favorites = loadFavorites();
      expect(favorites).toEqual([]);
      expect(Array.isArray(favorites)).toBe(true);
    });

    it('should handle multiple favorites correctly', () => {
      const testFavorites: Favorite[] = [
        {
          id: '1',
          location: 'Edinburgh',
          displayName: 'Edinburgh, Scotland',
          addedDate: '2024-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          location: 'Glasgow',
          displayName: 'Glasgow, Scotland',
          addedDate: '2024-01-01T01:00:00.000Z'
        },
        {
          id: '3',
          location: 'M1 1AA',
          displayName: 'Manchester City Centre',
          addedDate: '2024-01-01T02:00:00.000Z'
        }
      ];

      saveFavorites(testFavorites);
      const loaded = loadFavorites();

      expect(loaded).toHaveLength(3);
      expect(loaded.map(f => f.location)).toEqual(['Edinburgh', 'Glasgow', 'M1 1AA']);
    });
  });

  describe('Data Corruption Handling', () => {
    it('should handle corrupted JSON gracefully', () => {
      // Simulate corrupted data in localStorage
      localStorage.setItem(FAVORITES_KEY, '{invalid json');
      
      const favorites = loadFavorites();
      expect(favorites).toEqual([]);
      expect(Array.isArray(favorites)).toBe(true);
    });

    it('should handle empty string in localStorage', () => {
      localStorage.setItem(FAVORITES_KEY, '');
      
      const favorites = loadFavorites();
      expect(favorites).toEqual([]);
    });

    it('should handle null values in localStorage', () => {
      localStorage.setItem(FAVORITES_KEY, 'null');
      
      const favorites = loadFavorites();
      expect(favorites).toEqual([]);
    });

    it('should handle non-array JSON in localStorage', () => {
      localStorage.setItem(FAVORITES_KEY, '{"not": "an array"}');
      
      const favorites = loadFavorites();
      expect(favorites).toEqual([]);
    });

    it('should handle array with invalid favorite objects', () => {
      localStorage.setItem(FAVORITES_KEY, '[{"invalid": "favorite"}, null, undefined]');
      
      // Should not throw error and should return empty array or filtered results
      const favorites = loadFavorites();
      expect(Array.isArray(favorites)).toBe(true);
    });
  });

  describe('Storage Quota Exceeded Handling', () => {
    it('should throw error when storage quota is exceeded', () => {
      mockLocalStorage.setQuotaExceeded(true);
      
      const testFavorites: Favorite[] = [
        {
          id: '1',
          location: 'Edinburgh',
          displayName: 'Edinburgh, Scotland',
          addedDate: '2024-01-01T00:00:00.000Z'
        }
      ];

      expect(() => {
        saveFavorites(testFavorites);
      }).toThrow();
    });

    it('should not corrupt existing data when quota is exceeded', () => {
      // First, save some data successfully
      const initialFavorites: Favorite[] = [
        {
          id: '1',
          location: 'Edinburgh',
          displayName: 'Edinburgh, Scotland',
          addedDate: '2024-01-01T00:00:00.000Z'
        }
      ];
      saveFavorites(initialFavorites);

      // Now simulate quota exceeded on next save
      mockLocalStorage.setQuotaExceeded(true);
      
      const newFavorites: Favorite[] = [
        ...initialFavorites,
        {
          id: '2',
          location: 'Glasgow',
          displayName: 'Glasgow, Scotland',
          addedDate: '2024-01-01T01:00:00.000Z'
        }
      ];

      expect(() => {
        saveFavorites(newFavorites);
      }).toThrow();

      // Original data should still be intact
      mockLocalStorage.setQuotaExceeded(false);
      const loaded = loadFavorites();
      expect(loaded).toEqual(initialFavorites);
      expect(loaded).toHaveLength(1);
    });
  });

  describe('Add Favorite Functionality', () => {
    it('should add new favorite correctly', () => {
      const favorites = addFavorite('Edinburgh', 'Edinburgh, Scotland');
      
      expect(favorites).toHaveLength(1);
      expect(favorites[0].location).toBe('Edinburgh');
      expect(favorites[0].displayName).toBe('Edinburgh, Scotland');
      expect(favorites[0].id).toBeDefined();
      expect(favorites[0].addedDate).toBeDefined();
      
      // Verify it's actually saved to localStorage
      const loaded = loadFavorites();
      expect(loaded).toEqual(favorites);
    });

    it('should prevent duplicate favorites (case-insensitive)', () => {
      addFavorite('Edinburgh', 'Edinburgh, Scotland');
      const favorites = addFavorite('edinburgh', 'Edinburgh, Scotland'); // lowercase
      
      expect(favorites).toHaveLength(1);
      expect(favorites[0].location).toBe('Edinburgh'); // Original case preserved
    });

    it('should allow different locations with similar names', () => {
      addFavorite('Edinburgh', 'Edinburgh, Scotland');
      const favorites = addFavorite('New Edinburgh', 'New Edinburgh, Canada');
      
      expect(favorites).toHaveLength(2);
      expect(favorites.map(f => f.location)).toEqual(['Edinburgh', 'New Edinburgh']);
    });

    it('should generate unique IDs for favorites', () => {
      // Mock Date.now to ensure unique IDs
      let counter = 1000;
      const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => counter++);
      
      const favorites1 = addFavorite('Edinburgh', 'Edinburgh, Scotland');
      const favorites2 = addFavorite('Glasgow', 'Glasgow, Scotland');
      
      expect(favorites2).toHaveLength(2);
      expect(favorites2[0].id).not.toBe(favorites2[1].id);
      
      dateSpy.mockRestore();
    });
  });

  describe('Remove Favorite Functionality', () => {
    it('should remove favorite by ID correctly', () => {
      // Mock Date.now to ensure unique IDs for this specific test
      let counter = 1000;
      const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => counter++);
      
      const favorites1 = addFavorite('Edinburgh', 'Edinburgh, Scotland');
      const favorites2 = addFavorite('Glasgow', 'Glasgow, Scotland');
      
      expect(favorites2).toHaveLength(2);
      
      // Get the Edinburgh ID from the current favorites list
      const currentFavorites = loadFavorites();
      expect(currentFavorites).toHaveLength(2);
      
      const edinburghFavorite = currentFavorites.find(f => f.location === 'Edinburgh');
      expect(edinburghFavorite).toBeDefined();
      
      const remaining = removeFavorite(edinburghFavorite!.id);
      
      expect(remaining).toHaveLength(1);
      expect(remaining[0].location).toBe('Glasgow');
      
      // Verify it's actually removed from localStorage
      const loaded = loadFavorites();
      expect(loaded).toEqual(remaining);
      
      dateSpy.mockRestore();
    });

    it('should handle removal of non-existent favorite ID', () => {
      const favorites1 = addFavorite('Edinburgh', 'Edinburgh, Scotland');
      const remaining = removeFavorite('non-existent-id');
      
      expect(remaining).toEqual(favorites1);
      expect(remaining).toHaveLength(1);
    });

    it('should handle removal from empty favorites list', () => {
      const remaining = removeFavorite('any-id');
      expect(remaining).toEqual([]);
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    it('should handle very long location names', () => {
      const longLocation = 'A'.repeat(1000);
      const favorites = addFavorite(longLocation, 'Very Long Location Name');
      
      expect(favorites).toHaveLength(1);
      expect(favorites[0].location).toBe(longLocation);
    });

    it('should handle special characters in location names', () => {
      const specialLocation = 'Test-Location_123!@#$%^&*()[]{}|\\:";\'<>?,./ àáâãäåæçèéêë';
      const favorites = addFavorite(specialLocation, 'Location with Special Characters');
      
      expect(favorites).toHaveLength(1);
      expect(favorites[0].location).toBe(specialLocation);
      
      // Verify it survives save/load cycle
      const loaded = loadFavorites();
      expect(loaded[0].location).toBe(specialLocation);
    });

    it('should handle empty location names', () => {
      const favorites = addFavorite('', 'Empty Location');
      
      expect(favorites).toHaveLength(1);
      expect(favorites[0].location).toBe('');
    });

    it('should handle many favorites (stress test)', () => {
      // Add 100 favorites
      let currentFavorites: Favorite[] = [];
      for (let i = 0; i < 100; i++) {
        currentFavorites = addFavorite(`Location${i}`, `Display Name ${i}`);
      }
      
      expect(currentFavorites).toHaveLength(100);
      
      // Verify all are saved and loaded correctly
      const loaded = loadFavorites();
      expect(loaded).toHaveLength(100);
      expect(loaded.map(f => f.location)).toEqual(
        Array.from({ length: 100 }, (_, i) => `Location${i}`)
      );
    });
  });
});