export function getSlaStatus(lossRatio: number) {
  if (lossRatio > 0.01) return "VIOLATION"
  if (lossRatio > 0.005) return "WARNING"
  return "OK"
}
