import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/common';
import Layout from './components/layout/Layout';
import RiskOverview from './components/dashboard/RiskOverview';
import AlertFeed from './components/dashboard/AlertFeed';
import RiskVelocity from './components/dashboard/RiskVelocity';
import RiskCascade from './components/dashboard/RiskCascade';
import RiskHeatMap from './components/dashboard/RiskHeatMap';
import RiskRadar from './components/dashboard/RiskRadar';
import RiskTimeline from './components/dashboard/RiskTimeline';
import AgentStatus from './components/dashboard/AgentStatus';
import CopilotChat from './components/copilot/CopilotChat';
import CounterfactualPanel from './components/simulator/CounterfactualPanel';
import ApprovalQueue from './components/approval/ApprovalQueue';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');

  useEffect(() => {
    const onHashChange = () => setCurrentPath(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const renderContent = () => {
    switch (currentPath) {
      case '#/cascade':
        return <RiskCascade />;
      case '#/copilot':
        return <CopilotChat />;
      case '#/simulator':
        return <CounterfactualPanel />;
      case '#/approvals':
        return <ApprovalQueue />;
      case '#/':
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 2vw, 1.5rem)' }}>
            {/* Row 1: Risk Overview + Alert Feed */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: 'clamp(1rem, 2vw, 1.5rem)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 2vw, 1.5rem)' }}>
                <RiskOverview />
                <RiskVelocity />
              </div>
              <div style={{ minWidth: 0 }}>
                <AlertFeed />
              </div>
            </div>

            {/* Row 2: Agent Pipeline Status */}
            <AgentStatus />

            {/* Row 3: Radar + HeatMap + Timeline */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: 'clamp(1rem, 2vw, 1.5rem)',
            }}>
              <RiskRadar scores={{ financial: 55, customer: 42, fraud: 35, operational: 48, cyber: 28 }} />
              <RiskHeatMap />
            </div>

            {/* Row 4: Timeline */}
            <RiskTimeline />
          </div>
        );
    }
  };

  return (
    <Layout currentPath={currentPath}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
