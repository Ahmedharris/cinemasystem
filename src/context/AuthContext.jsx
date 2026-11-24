import React, { createContext, useContext, useState, useEffect } from 'react';
import { CUSTOMERS } from '../data/initialData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cms_user');
      return saved ? JSON.parse(saved) : CUSTOMERS[0]; // Default to Ali Raza for pleasant out-of-the-box demo
    } catch (e) {
      return CUSTOMERS[0];
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('cms_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cms_user');
    }
  }, [user]);

  const login = (email, password) => {
    // Look up customer in existing CUSTOMERS or created in local storage
    const customList = JSON.parse(localStorage.getItem('cms_customers') || '[]');
    const allUsers = [...CUSTOMERS, ...customList];
    const found = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (found) {
      setUser(found);
      return { success: true, user: found };
    }

    // Auto-create demo user if not found
    const newUser = {
      id: Date.now(),
      name: email.split('@')[0].replace(/[._]/g, ' '),
      email,
      phone: '0300-0000000',
      role: email.includes('admin') ? 'admin' : 'customer',
      joined: new Date().toISOString().split('T')[0]
    };
    setUser(newUser);
    return { success: true, user: newUser };
  };

  const register = ({ name, email, phone }) => {
    const newUser = {
      id: Date.now(),
      name,
      email,
      phone,
      role: email.includes('admin') ? 'admin' : 'customer',
      joined: new Date().toISOString().split('T')[0]
    };
    const customList = JSON.parse(localStorage.getItem('cms_customers') || '[]');
    customList.push(newUser);
    localStorage.setItem('cms_customers', JSON.stringify(customList));
    setUser(newUser);
    return { success: true, user: newUser };
  };

  const logout = () => {
    setUser(null);
  };

  const switchUser = (account) => {
    setUser(account);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, switchUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
