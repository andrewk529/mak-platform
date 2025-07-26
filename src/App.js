import React, { useState } from 'react';
import PropertySearch from './components/PropertySearch';
import MortgageCalculator from './components/MortgageCalculator';
import InsuranceIntegration from './components/InsuranceIntegration';
import AgentDashboard from './components/AgentDashboard';

function App() {
  const [currentView, setCurrentView] = useState('search');

  const renderView = () => {
    switch(currentView) {
      case 'search': return <PropertySearch />;
      case 'mortgage': return <MortgageCalculator />;
      case 'insurance': return <InsuranceIntegration />;
      case 'dashboard': return <AgentDashboard />;
      default: return <PropertySearch />;
    }
  };

  return (
    <div className="App">
      {renderView()}
    </div>
  );
}

export default App;
