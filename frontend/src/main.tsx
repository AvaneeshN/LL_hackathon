import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

// Create a client (you can customize options later if needed)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optional: good defaults for a dashboard-like app
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>               ← optional, but recommended in dev
  //   <QueryClientProvider ...>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
  // </React.StrictMode>
);
