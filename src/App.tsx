import { useState } from 'react';
import SideBar from './components/SideBar';
import AddCollection from './components/AddCollection';
import AddModels from './components/AddModels';
import AddColors from './components/AddColors';
import AddWidths from './components/AddWidths';
import AddPrice from './components/AddPrice';
import AddAssets from './components/AddAssets';
import AddTextures from './components/AddTextures';

function App() {
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
      case 'prices':
        return <AddPrice />;
      case 'assets':
        return <AddAssets />;
      case 'textures':
        return <AddTextures />;
      default:
        return <AddCollection />;
    }
  };

  return (
    <div className="app-container">
      <SideBar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
