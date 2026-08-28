export function planRoute(batches) {
  const depot = { lat: 19.99, lng: 73.78 };
  const remaining = batches.map((batch, index) => ({
    ...batch,
    lat: Number.isFinite(batch.lat) ? batch.lat : depot.lat + index * 0.04,
    lng: Number.isFinite(batch.lng) ? batch.lng : depot.lng + index * 0.04
  }));
  const route = [];
  let current = depot;

  while (remaining.length) {
    remaining.sort((a, b) => distance(current, a) - distance(current, b));
    const next = remaining.shift();
    if (!next) break;
    route.push(next);
    current = next;
  }

  return route;
}

function distance(a, b) {
  return Math.hypot((a.lat ?? 0) - (b.lat ?? 0), (a.lng ?? 0) - (b.lng ?? 0));
}
