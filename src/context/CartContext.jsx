import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCinema } from './CinemaContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { foodItems } = useCinema();

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_cart');
      return saved ? JSON.parse(saved) : { showId: null, seats: [], food: {}, promoCode: '', discountPct: 0 };
    } catch {
      return { showId: null, seats: [], food: {}, promoCode: '', discountPct: 0 };
    }
  });

  // Hold timer: 5 minutes reservation hold
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    localStorage.setItem('cms_cart', JSON.stringify(cart));
  }, [cart]);

  // Countdown timer for seat hold
  useEffect(() => {
    if (!cart.seats.length) {
      setTimeLeft(300);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Timer expired: clear cart
          setCart({ showId: null, seats: [], food: {}, promoCode: '', discountPct: 0 });
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cart.seats.length]);

  const selectSeats = (showId, seatsList) => {
    setCart(prev => ({
      ...prev,
      showId,
      seats: seatsList
    }));
    setTimeLeft(300); // reset 5 minute timer
  };

  const updateFoodQuantity = (foodId, delta) => {
    setCart(prev => {
      const current = prev.food[foodId] || 0;
      const next = Math.max(0, Math.min(10, current + delta));
      const nextFood = { ...prev.food };
      if (next > 0) {
        nextFood[foodId] = next;
      } else {
        delete nextFood[foodId];
      }
      return { ...prev, food: nextFood };
    });
  };

  const applyPromo = (code) => {
    const cleaned = code.trim().toUpperCase();
    if (cleaned === 'CINEMA20' || cleaned === 'PROMO20') {
      setCart(prev => ({ ...prev, promoCode: cleaned, discountPct: 20 }));
      return { success: true, message: '🎉 20% discount applied successfully!' };
    }
    if (cleaned === 'WELCOME10') {
      setCart(prev => ({ ...prev, promoCode: cleaned, discountPct: 10 }));
      return { success: true, message: '🎉 10% welcome discount applied!' };
    }
    return { success: false, message: 'Invalid promo code. Try "CINEMA20".' };
  };

  const removePromo = () => {
    setCart(prev => ({ ...prev, promoCode: '', discountPct: 0 }));
  };

  const clearCart = () => {
    setCart({ showId: null, seats: [], food: {}, promoCode: '', discountPct: 0 });
    setTimeLeft(300);
    localStorage.removeItem('cms_cart');
  };

  // Totals calculation
  const seatsTotal = (cart.seats || []).reduce((sum, s) => sum + (s.price || 0), 0);
  const foodTotal = Object.entries(cart.food || {}).reduce((sum, [id, qty]) => {
    const item = foodItems.find(f => String(f.id) === String(id));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const subtotal = seatsTotal + foodTotal;
  const discountTotal = Math.round(subtotal * ((cart.discountPct || 0) / 100));
  const grandTotal = Math.max(0, subtotal - discountTotal);

  const formatTimer = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        selectSeats,
        updateFoodQuantity,
        applyPromo,
        removePromo,
        clearCart,
        seatsTotal,
        foodTotal,
        subtotal,
        discountTotal,
        grandTotal,
        timeLeft,
        formatTimer
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
