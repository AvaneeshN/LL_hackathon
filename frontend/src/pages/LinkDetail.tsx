import { useParams, Link } from "react-router-dom"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { useTopology } from "@/hooks/useTopology"

const LinkDetail = () => {
  const { linkId } = useParams()
  const { data, isLoading, error } = useTopology()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="noc-panel rounded-lg p-6 text-center text-muted-foreground">
            Loading link details...
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
            Failed to load link data
          </div>
        </main>
      </div>
    )
  }

  const link = data.links.find((l: any) => l.id === linkId)

  if (!link) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <div className="noc-panel rounded-lg p-6 text-center text-muted-foreground">
            Link not found
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {link.id} — Engineering View
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Detailed fronthaul capacity and congestion analytics
            </p>
          </div>

          <Link
            to="/"
            className="text-xs font-mono text-primary hover:underline"
          >
            ← Back to Topology
          </Link>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Link Summary */}
          <div className="col-span-12 lg:col-span-4 noc-panel rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Link Summary
            </h3>

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Confidence</span>
                <span className="font-mono">
                  {(link.confidence * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between">
                <span>Peak Load</span>
                <span className="font-mono">
                  {link.capacity?.peak_gbps?.toFixed(1) || "0"} Gbps
                </span>
              </div>

              <div className="flex justify-between">
                <span>Safe Capacity</span>
                <span className="font-mono">
                  {link.capacity?.safe_gbps?.toFixed(1) || "0"} Gbps
                </span>
              </div>

              <div className="flex justify-between">
                <span>Congestion Risk</span>
                <span className="font-mono text-status-warning">
                  {((link.capacity?.congestion || 0) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Cells on Link */}
          <div className="col-span-12 lg:col-span-8 noc-panel rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Connected Cells
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {link.cells.map((cell: string) => (
                <div
                  key={cell}
                  className="noc-panel rounded-md p-3 text-center text-xs text-muted-foreground"
                >
                  <div className="text-foreground font-medium">
                    Cell {cell}
                  </div>
                  <div className="font-mono mt-1">
                    Status: Active
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LinkDetail
