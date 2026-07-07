import { createRoot } from "react-dom/client";
import { AuthProvider } from "./components/Auth/AuthProvider.tsx";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n"; // initialize i18n before render

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
