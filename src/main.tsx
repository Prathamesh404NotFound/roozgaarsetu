import { createRoot } from "react-dom/client";
import { AuthProvider } from "./components/Auth/AuthProvider.tsx";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n"; // initialize i18n before render

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </HelmetProvider>
);
