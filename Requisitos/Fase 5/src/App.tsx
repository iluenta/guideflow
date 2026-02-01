import React, { useState, useRef, Component } from 'react';
import { MenuGrid } from './components/MenuGrid';
import { HouseInfoPage } from './components/pages/HouseInfoPage';
import { CheckInPage } from './components/pages/CheckInPage';
import { AmenitiesPage } from './components/pages/AmenitiesPage';
import { HouseRulesPage } from './components/pages/HouseRulesPage';
import { WifiPage } from './components/pages/WifiPage';
import { EmergencyPage } from './components/pages/EmergencyPage';
import { TransportPage } from './components/pages/TransportPage';
import { CheckOutPage } from './components/pages/CheckOutPage';
import { NearestPage } from './components/pages/NearestPage';
import { GuidesPage } from './components/pages/GuidesPage';
import { ThingsToDoPage } from './components/pages/ThingsToDoPage';
import { ChatBot } from './components/ChatBot';
import { ChatOnboarding } from './components/ChatOnboarding';
import { BottomNav } from './components/BottomNav';
export function App() {
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const handleNavigate = (pageId: string) => {
    setCurrentPage(pageId);
    window.scrollTo(0, 0);
  };
  const handleBack = () => {
    setCurrentPage(null);
  };
  const handleOpenChat = () => {
    setIsChatOpen(true);
  };
  // Render the appropriate page based on currentPage state
  const renderPage = () => {
    switch (currentPage) {
      case 'house-info':
        return <HouseInfoPage onBack={handleBack} />;
      case 'check-in':
        return <CheckInPage onBack={handleBack} />;
      case 'amenities':
        return <AmenitiesPage onBack={handleBack} />;
      case 'rules':
        return <HouseRulesPage onBack={handleBack} />;
      case 'wifi':
        return <WifiPage onBack={handleBack} />;
      case 'emergency':
        return <EmergencyPage onBack={handleBack} />;
      case 'transport':
        return <TransportPage onBack={handleBack} />;
      case 'check-out':
        return <CheckOutPage onBack={handleBack} />;
      case 'nearest':
        return <NearestPage onBack={handleBack} />;
      case 'guides':
      case 'kitchen':
        return <GuidesPage onBack={handleBack} />;
      case 'things-do':
        return <ThingsToDoPage onBack={handleBack} />;
      case 'places-eat':
      case 'places-see':
        // For now, route these to nearest or keep as placeholders if pages don't exist
        return <NearestPage onBack={handleBack} />;
      default:
        return <MenuGrid onNavigate={handleNavigate} />;
    }
  };
  return (
    <div className="min-h-screen bg-beige flex justify-center">
      <main className="w-full max-w-md min-h-screen bg-beige shadow-2xl relative pb-20">
        {renderPage()}

        {/* Only show BottomNav on home page */}
        {!currentPage && <BottomNav />}
      </main>

      {/* Chat Components */}
      <ChatOnboarding onOpenChat={handleOpenChat} />

      <ChatBot isOpenControlled={isChatOpen} onOpenChange={setIsChatOpen} />
    </div>);

}