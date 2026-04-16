import { useEffect, useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  const [authPage, setAuthPage] = useState(null); // null, 'login', or 'signup'

  useEffect(() => {
    // Meta Pixel Setup
    const pixelId = import.meta.env.VITE_META_PIXEL_ID;
    if (pixelId) {
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', pixelId);
      fbq('track', 'PageView');
    }

    // Listen for login page navigation
    const handleNavigation = (e) => {
      if (e.detail?.page === 'login') {
        setAuthPage('login');
      } else if (e.detail?.page === 'signup') {
        setAuthPage('signup');
      }
    };

    window.addEventListener('navigate', handleNavigation);
    return () => window.removeEventListener('navigate', handleNavigation);
  }, []);

  const handleClose = () => setAuthPage(null);

  if (authPage === 'login') {
    return <Login onClose={handleClose} onNavigateToSignup={() => setAuthPage('signup')} />;
  }

  if (authPage === 'signup') {
    return <Signup onClose={handleClose} onNavigateToLogin={() => setAuthPage('login')} />;
  }

  return (
    <Home onNavigateToLogin={() => setAuthPage('login')} />
  );
}
