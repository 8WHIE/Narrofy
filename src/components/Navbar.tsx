import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationsDropdown } from './NotificationsDropdown';
import {
  BookOpen,
  Plus,
  User,
  LogOut,
  Settings,
  Database,
  Search,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  Compass,
} from 'lucide-react';

interface Props {
  onGoHome: () => void;
  onWriteClick: () => void;
  onOpenProfile: () => void;
  onSearch: (query: string) => void;
}

export const Navbar: React.FC<Props> = ({
  onGoHome,
  onWriteClick,
  onOpenProfile,
  onSearch,
}) => {
  const {
    user,
    profile,
    logout,
    openAuthModal,
    openConfigModal,
    connectionStatus,
    isConfigured,
  } = useAuth();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div
            onClick={onGoHome}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-extrabold text-lg shadow-md group-hover:scale-105 transition-transform">
              N
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-zinc-900 dark:text-white tracking-tight leading-none group-hover:text-amber-500 transition-colors">
                Narrofy
              </span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
                Storytelling
              </span>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center flex-1 max-w-md relative"
          >
            <Search size={14} className="absolute left-3 text-zinc-400" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search stories, authors, tags..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </form>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {/* Firebase Connection Pill */}
            <button
              onClick={openConfigModal}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                connectionStatus.tested && connectionStatus.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : isConfigured
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                  : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
              title="Firebase Project Connection Status"
            >
              <Database size={12} />
              <span>
                {connectionStatus.tested && connectionStatus.success
                  ? 'Firebase Live'
                  : isConfigured
                  ? 'Firebase Configured'
                  : 'Connect Firebase'}
              </span>
            </button>

            {/* Write Story Button */}
            <button
              onClick={onWriteClick}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-all shadow-sm"
            >
              <Plus size={15} />
              <span>Write</span>
            </button>

            {/* Notifications Dropdown */}
            {user && <NotificationsDropdown />}

            {/* User Profile or Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs overflow-hidden ring-2 ring-transparent hover:ring-amber-500 transition-all">
                    {profile?.photoURL || user.photoURL ? (
                      <img
                        src={profile?.photoURL || user.photoURL || ''}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile?.displayName?.charAt(0) || user.email?.charAt(0) || 'U'
                    )}
                  </div>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-2 z-50 text-xs">
                      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                        <p className="font-bold text-zinc-900 dark:text-white truncate">
                          {profile?.displayName || user.displayName || 'User'}
                        </p>
                        <p className="text-[11px] text-zinc-400 font-mono truncate">
                          @{profile?.username || 'storyteller'}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full p-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-2"
                      >
                        <User size={14} />
                        <span>Edit Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          openConfigModal();
                        }}
                        className="w-full p-2 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center gap-2"
                      >
                        <Database size={14} />
                        <span>Firebase Settings</span>
                      </button>

                      <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full p-2 rounded-xl text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2"
                      >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('signin')}
                  className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow transition-all"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-400"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-3 bg-white dark:bg-zinc-950">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search stories..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
            />
          </form>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onWriteClick();
            }}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-black text-xs font-bold flex items-center justify-center gap-2"
          >
            <Plus size={15} />
            <span>Write Story</span>
          </button>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              openConfigModal();
            }}
            className="w-full py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-2"
          >
            <Database size={14} />
            <span>Firebase Configuration</span>
          </button>
        </div>
      )}
    </nav>
  );
};
