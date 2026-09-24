/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { PersonalizedFeed } from './components/PersonalizedFeed';
import { StoryDetail } from './components/StoryDetail';
import { StoryEditor } from './components/StoryEditor';
import { AuthorProfileView } from './components/AuthorProfileView';
import { AuthModal } from './components/AuthModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { ProfileModal } from './components/ProfileModal';
import { OnboardingModal } from './components/OnboardingModal';
import { Story } from './types';
import { Database, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const {
    isConfigured,
    openConfigModal,
    configModalOpen,
    closeConfigModal,
    connectionStatus,
  } = useAuth();

  const [currentView, setCurrentView] = useState<'feed' | 'story' | 'write' | 'author'>('feed');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [viewAuthorId, setViewAuthorId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
    setCurrentView('story');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWriteClick = (storyToEdit?: Story) => {
    setEditingStory(storyToEdit || null);
    setCurrentView('write');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthorClick = (authorId: string) => {
    setViewAuthorId(authorId);
    setCurrentView('author');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setSelectedStory(null);
    setEditingStory(null);
    setViewAuthorId(null);
    setCurrentView('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      {/* Configuration Advisory Banner (only when connection needs setup) */}
      {!isConfigured && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs flex items-center justify-between text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2 max-w-2xl">
            <AlertTriangle size={15} className="shrink-0 text-amber-500" />
            <span>
              <strong>Connect Existing Firebase Project:</strong> Supply your Firebase configuration values in .env or via the in-app connector.
            </span>
          </div>
          <button
            onClick={openConfigModal}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-[11px] flex items-center gap-1 shrink-0 ml-2"
          >
            <Database size={12} />
            <span>Connect Project</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        onGoHome={handleGoHome}
        onWriteClick={() => handleWriteClick()}
        onOpenProfile={() => setProfileModalOpen(true)}
        onSearch={(q) => {
          // simple search
          handleGoHome();
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'feed' && (
          <PersonalizedFeed
            onSelectStory={handleSelectStory}
            onCreateStory={() => handleWriteClick()}
          />
        )}

        {currentView === 'story' && selectedStory && (
          <StoryDetail
            story={selectedStory}
            onBack={handleGoHome}
            onEdit={(s) => handleWriteClick(s)}
            onAuthorClick={handleAuthorClick}
          />
        )}

        {currentView === 'write' && (
          <StoryEditor
            initialStory={editingStory}
            onBack={handleGoHome}
            onSaved={(savedStory) => {
              setSelectedStory(savedStory);
              setCurrentView('story');
            }}
          />
        )}

        {currentView === 'author' && viewAuthorId && (
          <AuthorProfileView
            authorId={viewAuthorId}
            onBack={handleGoHome}
            onSelectStory={handleSelectStory}
          />
        )}
      </main>

      {/* Global Modals */}
      <AuthModal />
      <FirebaseConfigModal
        isOpen={configModalOpen}
        onClose={closeConfigModal}
      />
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
      <OnboardingModal />

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 py-8 px-4 mt-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-amber-500 text-black font-black text-[10px] flex items-center justify-center">
              N
            </div>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">Narrofy</span>
            <span>— Existing Firebase Integration Active</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={openConfigModal}
              className="hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              <Database size={12} />
              <span>Firebase Credentials</span>
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={13} />
              <span>24-Hour Rule Protected</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
