import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Film, User, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CUSTOMERS } from '../data/initialData';

export default function Login() {
  const navigate = useNavigate();
  const { login, switchUser } = useAuth();

  const [email, setEmail] = useState('ali.raza@example.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
    navigate('/');
  };

  const handleQuickDemo = (account) => {
    switchUser(account);
    if (account.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black mx-auto shadow-xl">
          <Film className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
          Welcome to CineMax
        </h1>
        <p className="text-xs text-slate-400">
          Sign in to access your digital tickets, booking history, and rewards.
        </p>
      </div>

      <div className="bg-[#111726] border border-[#23304a] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Email Address</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#182238] border border-[#23304a] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#182238] border border-[#23304a] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all"
          >
            Sign In
          </button>
        </form>

        {/* 1-Click Test Credentials */}
        <div className="pt-4 border-t border-[#23304a] space-y-2.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-center">
            Instant 1-Click Demo Profiles
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo(CUSTOMERS[0])}
              className="bg-[#182238] hover:bg-[#202c48] border border-[#23304a] p-2.5 rounded-xl text-left transition-colors"
            >
              <span className="text-xs font-bold text-white block">Ali Raza</span>
              <span className="text-[10px] text-amber-400">Customer Demo</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo(CUSTOMERS[4])}
              className="bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 p-2.5 rounded-xl text-left transition-colors"
            >
              <span className="text-xs font-bold text-purple-200 block">Manager</span>
              <span className="text-[10px] text-purple-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Admin Portal
              </span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-[#23304a]">
          Don't have an account?{' '}
          <Link to="/register" className="text-amber-400 font-bold hover:underline">
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
}
