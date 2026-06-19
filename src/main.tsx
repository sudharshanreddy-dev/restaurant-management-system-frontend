import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#fff",
                color: "#1E1E1E",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                borderRadius: "12px",
                padding: "12px 16px",
              },
              success: {
                iconTheme: {
                  primary: "#2A9D8F",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#DC2626",
                  secondary: "#fff",
                },
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
