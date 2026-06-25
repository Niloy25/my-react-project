// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import "./index.css";
// import App from "./App.jsx";

// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// // Create QueryClient instance
// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       staleTime: 1000 * 60, // 1 minute
//       retry: 2,
//       refetchOnWindowFocus: false,
//     },
//   },
// });

// createRoot(document.getElementById("root")).render(
//   <StrictMode>
//     <QueryClientProvider client={queryClient}>
//       <App />
//     </QueryClientProvider>
//   </StrictMode>,
// );

import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/store";
import "./index.css";
import App from "./App.jsx";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Restore session on every page load/refresh
// Reads the httpOnly cookie and gets a fresh access token
import { restoreSession } from "./store/authSlice";
store.dispatch(restoreSession()); // ← ADD

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </StrictMode>,
);

// ── What changed from original main.jsx ──────────────────
// REMOVED: import { AuthProvider } from './context/AuthContext'
// ADDED:   import { Provider } from 'react-redux'
// ADDED:   import store from './store/store'
// ADDED:   store.dispatch(restoreSession())
// CHANGED: <AuthProvider> → <Provider store={store}>
