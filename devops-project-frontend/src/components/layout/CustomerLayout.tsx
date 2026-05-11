import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Screen, ScreenProps } from '../../types';

interface CustomerLayoutProps extends ScreenProps {
  activeScreen: Screen;
  children: React.ReactNode;
}

export default function CustomerLayout({ onNavigate, activeScreen, children }: CustomerLayoutProps) {
  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen flex flex-col">
      <Header onNavigate={onNavigate} activeScreen={activeScreen} />
      <main className="flex-grow pt-24">
        {children}
      </main>
      <Footer />
    </div>
  );
}
