
import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { FoundationsPage } from './pages/FoundationsPage';
import { PillarsPage } from './pages/PillarsPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { InvolvedPage } from './pages/InvolvedPage';
import { DocsPage } from './pages/DocsPage';
import { DocsPlannerPage } from './pages/DocsPlannerPage';
import { ResearchPage } from './pages/ResearchPage';
import { AppPage } from './pages/AppPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { PlanProvider } from './contexts/PlanContext';
import Gateway1Page from './pages/app/Gateway1';
import MonitoringDashboardPage from './pages/app/MonitoringDashboardPage';


// A simple component to handle scroll restoration on navigation
const ScrollToTop = () => {
    const { pathname, search } = useLocation();

    React.useEffect(() => {
        // The app uses a custom scroll container; reset it on navigation so
        // deep tool views don't leave other pages scrolled past the content.
        const container = document.getElementById('app-scroll-container');
        if (container && typeof (container as HTMLElement).scrollTo === 'function') {
            (container as HTMLElement).scrollTo({ top: 0, left: 0 });
        } else {
            window.scrollTo({ top: 0, left: 0 });
        }
    }, [pathname, search]);

    return null;
}

const AnimatedRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<FoundationsPage />} />
                <Route path="/foundations" element={<FoundationsPage />} />
                <Route path="/capabilities" element={<PillarsPage />} />
                <Route path="/pillars" element={<PillarsPage />} />
                <Route path="/reasoning-architecture" element={<ArchitecturePage />} />
                <Route path="/architecture" element={<ArchitecturePage />} />
                <Route path="/research" element={<ResearchPage />} />
                <Route path="/research/:slug" element={<ResearchPage />} />
                <Route path="/involved" element={<InvolvedPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/docs/planner" element={<DocsPlannerPage />} />
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
