import { useQuery } from "@tanstack/react-query"
import { getTopology } from "@/api"
import { TopologyData } from "@/types"

export function useTopology() {
  return useQuery<TopologyData>({
    queryKey: ["topology"],
    queryFn: getTopology,
    refetchInterval: 5000, // auto-refresh every 5s
  })
}
