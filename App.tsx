
import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { FoundationsPage } from './pages/FoundationsPage';
import { PillarsPage } from './pages/PillarsPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { InvolvedPage } from './pages/InvolvedPage';
import { AppPage } from './pages/AppPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { PlanProvider } from './contexts/PlanContext';
import Gateway1Page from './pages/app/Gateway1';
import MonitoringDashboardPage from './pages/app/MonitoringDashboardPage';


// A simple component to handle scroll restoration on navigation
const ScrollToTop = () => {
    const { pathname } = useLocation();

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

const AnimatedRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<HomePage />} />
                <Route path="/foundations" element={<FoundationsPage />} />
                <Route path="/pillars" element={<PillarsPage />} />
                <Route path="/architecture" element={<ArchitecturePage />} />
                <Route path="/involved" element={<InvolvedPage />} />
                <Route path="/app" element={<AppPage />} />
                <Route path="/app/gateway1" element={<Gateway1Page />} />
                <Route path="/app/monitoring" element={<MonitoringDashboardPage />} />
            </Routes>
        </AnimatePresence>
    );
};

export default function App() {
  return (
    <ThemeProvider>
      <PlanProvider>
        <HashRouter>
          <ScrollToTop />
          <Layout>
            <AnimatedRoutes />
          </Layout>
        </HashRouter>
      </PlanProvider>
    </ThemeProvider>
  );
}
