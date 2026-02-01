export interface LinkState {
  buffer: number
}

const PACKET_SIZE_MB = 0.001 // 1MB packets
const MAX_BUFFER_MB = 50    // realistic fronthaul switch buffer

export function simulateLinkStep(
  loadGbps: number,
  safeGbps: number,
  prevState: LinkState
) {
  const incomingMB = loadGbps * 125 // Gbps → MB/s
  const serviceMB = safeGbps * 125

  let buffer = prevState.buffer + incomingMB - serviceMB
  let dropped = 0

  if (buffer > MAX_BUFFER_MB) {
    dropped = buffer - MAX_BUFFER_MB
    buffer = MAX_BUFFER_MB
  }

  if (buffer < 0) buffer = 0

  const totalPackets = incomingMB / PACKET_SIZE_MB
  const droppedPackets = dropped / PACKET_SIZE_MB

  const lossRatio =
    totalPackets > 0 ? droppedPackets / totalPackets : 0

  return {
    buffer,
    lossRatio
  }
}
