import React, { useState } from 'react';
import { PropertyListView } from './components/PropertyListView';
import { QuickStartWizard } from './components/QuickStartWizard';
import { GuideDashboard } from './components/GuideDashboard';
type View = 'list' | 'quickstart' | 'dashboard';
export function App() {
  const [currentView, setCurrentView] = useState<View>('list');
  const renderView = () => {
    switch (currentView) {
      case 'list':
        return (
          <PropertyListView
            onNewProperty={() => setCurrentView('quickstart')}
            onConfigure={() => setCurrentView('dashboard')} />);


      case 'quickstart':
        return (
          <QuickStartWizard
            onComplete={() => setCurrentView('dashboard')}
            onBack={() => setCurrentView('list')} />);


      case 'dashboard':
        return <GuideDashboard onBack={() => setCurrentView('list')} />;
      default:
        return <div>View not found</div>;
    }
  };
  return (
    <div className="min-h-screen bg-background font-sans text-text-primary">
      {renderView()}
    </div>);

}