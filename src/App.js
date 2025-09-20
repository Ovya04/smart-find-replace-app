import React, { useState, useEffect } from 'react';
import ContentstackAppSdk from '@contentstack/app-sdk';
import FindReplaceForm from './components/FindReplaceForm';
import PreviewTable from './components/PreviewTable';
import './App.css';

function App() {
  const [appSdk, setAppSdk] = useState(null);
  const [config, setConfig] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Initializing Contentstack App SDK...');
    
    ContentstackAppSdk.init()
      .then((sdk) => {
        console.log('SDK initialized successfully:', sdk);
        setAppSdk(sdk);
        
        // Get app configuration
        const appConfig = sdk.location?.DashboardWidget?.config || sdk.config;
        setConfig(appConfig);
        
        // Set window title
        document.title = 'Smart Find & Replace';
      })
      .catch((err) => {
        console.error('SDK initialization failed:', err);
        setError(`SDK initialization failed: ${err.message}`);
      });
  }, []);

  // Show loading state while SDK initializes
  if (!appSdk && !error) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Initializing Smart Find & Replace...</p>
        <small>This may take a few moments...</small>
      </div>
    );
  }

  // Show error if SDK fails to initialize
  if (error) {
    return (
      <div className="error-container">
        <h2>⚠️ Initialization Error</h2>
        <p>{error}</p>
        <p>Please ensure this app is running within the Contentstack dashboard.</p>
      </div>
    );
  }

  // Rest of your app logic...
  const handleScan = async (formData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'}/api/find-replace/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          authtoken: appSdk.authtoken,
          apiKey: appSdk.stack.api_key
        })
      });

      const results = await response.json();
      setScanResults(results);
    } catch (error) {
      console.error('Scan error:', error);
      appSdk.notify('Error scanning content', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="smart-find-replace-app">
      <div className="app-header">
        <h1>🔍 Smart Find & Replace</h1>
        <p>Context-aware content replacement across your stack</p>
      </div>

      <div className="app-content">
        {!scanResults ? (
          <FindReplaceForm 
            onScan={handleScan}
            isLoading={isLoading}
            config={config}
          />
        ) : (
          <PreviewTable
            results={scanResults}
            onApply={handleApply}
            onBack={() => setScanResults(null)}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

export default App;
