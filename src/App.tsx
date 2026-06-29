import { useState } from 'react';
import SideBar from './components/SideBar';
import AddCollection from './components/AddCollection';
import AddModels from './components/AddModels';
import AddColors from './components/AddColors';
import AddWidths from './components/AddWidths';
import AddAssets from './components/AddAssets';
import AddTextures from './components/AddTextures';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwtToken'));
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [currentTab, setCurrentTab] = useState('collections');

  const renderContent = () => {
    switch (currentTab) {
      case 'collections':
        return <AddCollection />;
      case 'models':
        return <AddModels />;
      case 'colors':
        return <AddColors />;
      case 'widths':
        return <AddWidths />;
      case 'assets':
        return <AddAssets />;
      case 'textures':
        return <AddTextures />;
      default:
        return <AddCollection />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    setToken(null);
  };

  // If the user is not authenticated, render the login or signup screen
  if (!token) {
    if (authView === 'signup') {
      return (
        <SignupPage
          onSignupSuccess={() => setAuthView('login')}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={(newToken) => setToken(newToken)}
        onNavigateToSignup={() => setAuthView('signup')}
      />
    );
  }

  return (
    <div className="app-container">
      <SideBar currentTab={currentTab} setCurrentTab={setCurrentTab} onLogout={handleLogout} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
