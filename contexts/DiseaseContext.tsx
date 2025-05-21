// contexts/DiseaseContext.tsx

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { ENDPOINTS } from '../utils/config';
import { useAuth } from './AuthContext';
type Disease = {
  id: string;
  name: string;
  description: string;
  // add other relevant fields based on API response
};

type DiseaseContextType = {
  diseases: Disease[] | null;
  loading: boolean;
  error: string | null;
  refreshDiseases: () => void;
};

const DiseaseContext = createContext<DiseaseContextType>({
  diseases: null,
  loading: false,
  error: null,
  refreshDiseases: () => {},
});

export const useDisease = () => useContext(DiseaseContext);

export const DiseaseProvider = ({ children }: { children: ReactNode }) => {
      const { accessToken, refreshAccessToken } = useAuth();
  const [diseases, setDiseases] = useState<Disease[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiseases = async () => {
    const token = accessToken;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(ENDPOINTS.DISEASES, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch diseases');
      }
      const data = await response.json();
      // console.log(data,'this is desaese list');
      
      setDiseases(data.diseases || data); // Adjust based on your API response structure
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setDiseases(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiseases();
  }, []);

  return (
    <DiseaseContext.Provider
      value={{ diseases, loading, error, refreshDiseases: fetchDiseases }}
    >
      {children}
    </DiseaseContext.Provider>
  );
};
