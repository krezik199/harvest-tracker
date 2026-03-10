import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { LangProvider } from './i18n/LangContext.jsx';
import { ConfigProvider } from './i18n/ConfigContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LangProvider>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </LangProvider>
  </React.StrictMode>
);
