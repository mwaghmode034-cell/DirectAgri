export function planRoute(batches) {
  const depot = { lat: 19.99, lng: 73.78 };
  const remaining = [...batches];
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
  return Math.hypot(a.lat - b.lat, a.lng - b.lng);
}
