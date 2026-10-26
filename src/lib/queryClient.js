import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min : évite les refetch trop fréquents
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
