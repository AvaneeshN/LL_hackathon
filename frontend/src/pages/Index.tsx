import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { useTopology } from "@/hooks/useTopology"
import { Link } from "react-router-dom"

const Index = () => {
  const { data, isLoading, error } = useTopology()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="noc-panel rounded-lg p-6 text-center text-muted-foreground">
            Loading fronthaul topology...
          </div>
        </main>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="noc-panel rounded-lg p-6 text-center text-red-500">
            Failed to load topology data
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      <main className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Fronthaul Topology Overview
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Inferred links, grouped cells, and estimated Ethernet capacity
          </p>
        </div>

        {/* Topology Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Link Cards */}
          <div className="col-span-12 noc-panel rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">
                Active Fronthaul Links
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                Total Links: {data.links.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.links.map((link: any) => (
                <Link
                  to={`/link/${link.id}`}
                  key={link.id}
                  className="noc-panel rounded-lg p-4 border border-border hover:border-primary transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      {link.id}
                    </h4>
                    <span className="text-xs font-mono text-muted-foreground">
                      {link.cells.length} cells
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div>
                      <span className="text-foreground font-medium">
                        Cells:
                      </span>{" "}
                      {link.cells.join(", ")}
                    </div>

                    <div className="flex justify-between">
                      <span>Confidence</span>
                      <span className="font-mono">
                        {(link.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Safe Capacity</span>
                      <span className="font-mono">
                        {link.capacity?.safe_gbps?.toFixed(1) || "0"} Gbps
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Index
