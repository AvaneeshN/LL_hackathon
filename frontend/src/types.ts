export interface Capacity {
  peak_gbps: number
  safe_gbps: number
  buffer_mode?: string
  congestion?: number
}

export interface Link {
  id: string
  cells: string[]
  confidence: number
  capacity: Capacity
  traffic_timeseries?: number[]
}

export interface TopologyData {
  generated_at: string
  dataset: string
  threshold: number
  cell_count: number
  links: Link[]
}
