/**
 * Auth Service — Frontend Authentication Management
 */

class AuthService {
  constructor() {
    this.API_URL = 'http://localhost:3000/api/auth';
    this.TOKEN_KEY = 'nxt-token';
    this.USER_KEY = 'nxt-user';
  }

  // ===== REGISTER =====
  async register(name, email, password, phone) {
    try {
      const res = await fetch(`${this.API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Save token and user
      this.setSession(data.token, data.user);

      return { success: true, user: data.user };
    } catch (err) {
      console.error('Register error:', err);
      return { success: false, error: err.message };
    }
  }

  // ===== LOGIN =====
  async login(email, password) {
    try {
      const res = await fetch(`${this.API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save token and user
      this.setSession(data.token, data.user);

      return { success: true, user: data.user };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: err.message };
    }
  }

  // ===== LOGOUT =====
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = 'login.html';
  }

  // ===== GET CURRENT USER =====
  getCurrentUser() {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // ===== CHECK IF LOGGED IN =====
  isLoggedIn() {
    return !!this.getToken();
  }

  // ===== GET TOKEN =====
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // ===== SET SESSION =====
  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // ===== UPDATE PROFILE =====
  async updateProfile(updates) {
    try {
      const token = this.getToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${this.API_URL}/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Update failed');
      }

      // Update local storage
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (err) {
      console.error('Update error:', err);
      return { success: false, error: err.message };
    }
  }

  // ===== FORGOT PASSWORD =====
  async forgotPassword(email) {
    try {
      const res = await fetch(`${this.API_URL}/forgotpassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return { success: true, message: data.message };
    } catch (err) {
      console.error('Forgot password error:', err);
      return { success: false, error: err.message };
    }
  }

  // ===== RESET PASSWORD =====
  async resetPassword(token, password) {
    try {
      const res = await fetch(`${this.API_URL}/resetpassword/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Reset failed');
      }

      // Update session with new token
      this.setSession(data.token, this.getCurrentUser());

      return { success: true, message: data.message };
    } catch (err) {
      console.error('Reset password error:', err);
      return { success: false, error: err.message };
    }
  }
}

// Global instance
const authService = new AuthService();