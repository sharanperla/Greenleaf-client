import React, { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'sonner-native';
import { ENDPOINTS } from '../utils/config'; // Update this to include your prediction URL
import { useAuth } from './AuthContext'; // Assuming you already have this

interface PredictionResult {
  disease: string;
  confidence: number;
  remedies?: string[];
   other_predictions: {
    disease: string;
    confidence: number;
  }[];
  
}

interface PredictionContextType {
  predict: (imageUri: string) => Promise<PredictionResult | null>;
  result: PredictionResult | null;
  loading: boolean;
  error: string | null;
}

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

const PredictionProvider = ({ children }: { children: ReactNode }) => {
  const { accessToken, refreshAccessToken } = useAuth();
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predict = async (imageUri: string): Promise<PredictionResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const token = accessToken;

      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'leaf.jpg',
      } as any);

      const response = await fetch(ENDPOINTS.PREDICT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) throw new Error('Token refresh failed');

        const retry = await fetch(ENDPOINTS.PREDICT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
          body: formData,
        });

        if (!retry.ok) throw new Error('Prediction failed after retry');

        const retryResult = await retry.json();
        setResult(retryResult);
        return retryResult;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Prediction failed');
      }

      const data = await response.json();
      console.log('this is the result of prediction',data);
      
      setResult(data);
      return data;
    } catch (err: any) {
      const message = err.message || 'Unknown error';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <PredictionContext.Provider value={{ predict, result, loading, error }}>
      {children}
    </PredictionContext.Provider>
  );
};

export const usePrediction = () => {
  const context = useContext(PredictionContext);
  if (!context) {
    throw new Error('usePrediction must be used within a PredictionProvider');
  }
  return context;
};


export default PredictionProvider;