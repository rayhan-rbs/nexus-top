/**
 * DataService — Centralized data management
 * Handles: API calls, caching, error handling
 * 
 * 
 */


class DataService {
  constructor() {
    this.cache = null;
    this.cacheTime = 0;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.API_URL = API_BASE_URL+'/api/games'; // Backend API
    this.JSON_FALLBACK = 'data/games.json'; // Local JSON fallback
    this.useAPI = true; // Set to false if backend not running
  }

  /**
   * Fetch all games data
   * Priority: Cache → API → Local JSON → LocalStorage
   */
  async getGames() {
    // 1. Check cache first
    if (this.cache && (Date.now() - this.cacheTime) < this.CACHE_DURATION) {
      console.log('✅ Loaded from cache');
      return this.cache;
    }

    try {
      let data;

      // 2. Try API first (if enabled)
      if (this.useAPI) {
        try {
          const res = await fetch(this.API_URL);
          if (!res.ok) throw new Error('API failed');
          data = await res.json();
          console.log('✅ Loaded from API');
        } catch (err) {
          console.warn('⚠️ API failed, falling back to JSON:', err);
        }
      }

      // 3. Fallback to local JSON
      if (!data) {
        const res = await fetch(this.JSON_FALLBACK);
        if (!res.ok) throw new Error('JSON file not found');
        data = await res.json();
        console.log('✅ Loaded from JSON file');
      }

      // 4. Cache it
      this.cache = data;
      this.cacheTime = Date.now();

      // 5. Also save to localStorage for offline
      try {
        localStorage.setItem('nxt-games-cache', JSON.stringify(data));
        localStorage.setItem('nxt-games-time', Date.now());
      } catch(e) {}

      return data;

    } catch (err) {
      console.error('❌ Data load error:', err);
      // 6. Last resort — localStorage
      const saved = localStorage.getItem('nxt-games-cache');
      if (saved) {
        console.log('✅ Loaded from localStorage fallback');
        return JSON.parse(saved);
      }
      throw err;
    }
  }

  /**
   * Get single game by ID
   */
  async getGameById(id) {
    try {
      // First try API
      if (this.useAPI) {
        try {
          const res = await fetch(API_BASE_URL+`/api/games/${id}`);
          const data = await res.json();
          if (data.success && data.game) {
            console.log('✅ Game loaded from API:', data.game.title);
            return data.game;
          }
        } catch (err) {
          console.warn('⚠️ API failed for single game, trying fallback');
        }
      }

      // Fallback to cached games
      const data = await this.getGames();
      return data.games.find(g => g.id === id || g.gameId === id) || null;
    } catch (err) {
      console.error('❌ Get game by ID error:', err);
      return null;
    }
  }

  /**
   * Filter games by category
   */
  async getGamesByCategory(category) {
    const data = await this.getGames();
    if (category === 'all') return data.games.filter(g => g.status === 'active');
    return data.games.filter(g => g.category === category && g.status === 'active');
  }

  /**
   * Search games
   */
  async searchGames(query) {
    const data = await this.getGames();
    const q = query.toLowerCase();
    return data.games.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.tag.toLowerCase().includes(q)
    );
  }

  /**
   * Force refresh (bypass cache)
   */
  async refresh() {
    this.cache = null;
    this.cacheTime = 0;
    return await this.getGames();
  }

  /**
   * Get site settings
   */
  async getSettings() {
    return {
      siteName: 'NexusTop',
      currency: 'BDT',
      currencySymbol: '৳',
      lastUpdated: new Date().toISOString()
    };
  }
}

// Global instance
const dataService = new DataService();