import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { GuideWizard } from './pages/GuideWizard';
import { SpecDocument } from './pages/SpecDocument';
export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'properties':
        return <Properties />;
      case 'guides':
        // For demo purposes, reusing Wizard for guides tab or could be a list
        return <GuideWizard />;
      case 'specs':
        return <SpecDocument />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <h2 className="text-xl font-bold text-navy mb-2">Próximamente</h2>
              <p>Esta sección está en desarrollo.</p>
            </div>
          </div>);

    }
  };
  return (
    <div className="flex h-screen bg-[#F8F7F4] overflow-hidden font-sans text-navy">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />

        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {renderContent()}
        </main>
      </div>
    </div>);

}