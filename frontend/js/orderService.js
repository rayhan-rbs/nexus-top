/**
 * Order Service — Frontend Order Management
 */

const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:3000' 
    : 'https://nexustop-api.onrender.com';

class OrderService {
  constructor() {
    this.API_URL = API_BASE_URL+'/api/orders';
  }

  // ===== CREATE ORDER =====
  async createOrder(orderData) {
  try {
    const token = authService.getToken();
    
    if (!token) {
      throw new Error('Please login first');
    }

    console.log('🔑 Token:', token.substring(0, 20) + '...');
    console.log('📤 Sending to:', `${this.API_URL}`);

    const res = await fetch(`${this.API_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    console.log('📡 Response status:', res.status);

    const data = await res.json();
    console.log('📥 Response data:', data);

    if (!res.ok) {
      throw new Error(data.error || `Server error: ${res.status}`);
    }

    return { success: true, order: data.order };
  } catch (err) {
    console.error('❌ Create order error:', err);
    return { success: false, error: err.message };
  }
}

  // ===== GET MY ORDERS =====
  async getMyOrders() {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Please login first');
      }

      const res = await fetch(`${this.API_URL}/my`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      return { success: true, orders: data.orders };
    } catch (err) {
      console.error('Get orders error:', err);
      return { success: false, error: err.message };
    }
  }

  // ===== GET SINGLE ORDER =====
  async getOrderById(orderId) {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Please login first');
      }

      const res = await fetch(`${this.API_URL}/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch order');
      }

      return { success: true, order: data.order };
    } catch (err) {
      console.error('Get order error:', err);
      return { success: false, error: err.message };
    }
  }

  // ===== CANCEL ORDER =====
  async cancelOrder(orderId, reason) {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Please login first');
      }

      const res = await fetch(`${this.API_URL}/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      return { success: true, order: data.order };
    } catch (err) {
      console.error('Cancel order error:', err);
      return { success: false, error: err.message };
    }
  }
}

// Global instance
const orderService = new OrderService();