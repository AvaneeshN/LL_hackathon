const COLORS = [
  "#00D4FF", // cyan
  "#FF3366", // red
  "#FFD93D", // yellow
  "#00FF88", // green
  "#9D4EDD", // purple
  "#FF8C00", // orange
  "#4CC9F0", // sky
  "#F72585"  // pink
]

export function getLinkColor(linkId: string) {
  const num = parseInt(linkId.replace("Link_", "")) || 0
  return COLORS[num % COLORS.length]
}
