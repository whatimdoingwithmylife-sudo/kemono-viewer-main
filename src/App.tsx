import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider"
import Home from '@/pages/Home';
import Creator from '@/pages/Creator';
import Post from '@/pages/Post';
import Artists from '@/pages/Artists';
import Favourites from '@/pages/Favourites';
import Settings from '@/pages/Settings';
import { Layout } from '@/components/layout/Layout';

// Scroll to top on forward navigation, preserve on back
function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // Only scroll to top on PUSH (clicking links), not on POP (back/forward)
    if (navigationType === 'PUSH') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  return null;
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/favourites" element={<Favourites />} />
            <Route path="/creator/:service/:id" element={<Creator />} />
            <Route path="/post/:service/:user/:id" element={<Post />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
