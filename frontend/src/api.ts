export const API_URL = "http://localhost:5000/api/topology"

export async function getTopology() {
  const res = await fetch(API_URL)

  if (!res.ok) {
    throw new Error("Failed to fetch topology from backend")
  }

  return res.json()
}

