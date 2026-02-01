import { useQuery } from "@tanstack/react-query";   // ← note the hyphen and quotes

import { getTopology } from "@/api";
import { TopologyData } from "@/types";

export function useTopology() {
  return useQuery<TopologyData>({
    queryKey: ["topology"],
    queryFn: getTopology,
    refetchInterval: 5000,
  });
}