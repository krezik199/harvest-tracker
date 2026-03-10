import { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadConfig = () => {
    fetch('/api/config')
      .then(r => r.json())
      .then(data => { setConfig(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadConfig(); }, []);

  // Helper: get active names only for a list
  const activeNames = (list) => (list || []).filter(i => i.active).map(i => i.name);

  return (
    <ConfigContext.Provider value={{ config, loading, activeNames, reload: loadConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
