// contexts/AppProviders.tsx
import React, { ReactNode } from "react";
import { AuthProvider } from "./AuthContext";
import { ChatProvider } from "./ChatContext";
import { DiseaseProvider } from "./DiseaseContext";
import PredictionProvider from "./PredictionProvider";
// Import other providers if needed
// import { ThemeProvider } from "./ThemeContext";
// import { SettingsProvider } from "./SettingsContext";

interface Props {
  children: ReactNode;
}

const AppProviders = ({ children }: Props) => {
  return (
    <AuthProvider>
        <PredictionProvider>
          <DiseaseProvider>
            <ChatProvider>
      {/* Wrap with other providers if needed */}
      {/* <ThemeProvider> */}
      {/*   <SettingsProvider> */}
      {/*     {children} */}
      {/*   </SettingsProvider> */}
      {/* </ThemeProvider> */}
      {children}
      </ChatProvider>
      </DiseaseProvider>
      </PredictionProvider>
    </AuthProvider>
  );
};

export default AppProviders;
