// Pure reducer for the synthetic ITCH-style replay. Integer price ticks and quantities.
// Synthetic protocol demonstration; not live trading data or a hardware benchmark.

export type Side = "B" | "S";
export type Order = { id: number; side: Side; price: number; qty: number };

export type BookEvent =
  | { type: "A"; id: number; side: Side; price: number; qty: number }
  | { type: "X"; id: number; qty: number }
  | { type: "E"; id: number; qty: number }
  | { type: "U"; id: number; newId: number; price: number; qty: number };

export type BookState = { orders: Order[]; error: string | null };

export const emptyBook: BookState = { orders: [], error: null };

export function applyEvent(state: BookState, ev: BookEvent): BookState {
  const orders = state.orders.map((o) => ({ ...o }));
  const idx = (id: number) => orders.findIndex((o) => o.id === id);
  switch (ev.type) {
    case "A": {
      if (idx(ev.id) !== -1) return { orders: state.orders, error: `duplicate order ${ev.id}` };
      if (ev.qty <= 0) return { orders: state.orders, error: "non-positive quantity" };
      orders.push({ id: ev.id, side: ev.side, price: ev.price, qty: ev.qty });
      return { orders, error: null };
    }
    case "X":
    case "E": {
      const i = idx(ev.id);
      if (i === -1) return { orders: state.orders, error: `unknown order ${ev.id}` };
      // saturating reduction: an order reduced to zero is removed, never negative
      const remaining = Math.max(0, orders[i].qty - ev.qty);
      if (remaining === 0) orders.splice(i, 1);
      else orders[i].qty = remaining;
      return { orders, error: null };
    }
    case "U": {
      const i = idx(ev.id);
      if (i === -1) return { orders: state.orders, error: `unknown order ${ev.id}` };
      const side = orders[i].side; // replace preserves side
      orders.splice(i, 1);
      orders.push({ id: ev.newId, side, price: ev.price, qty: ev.qty });
      return { orders, error: null };
    }
  }
}

export function replay(events: BookEvent[], upto: number): BookState {
  let s = emptyBook;
  for (let i = 0; i < upto && i < events.length; i++) s = applyEvent(s, events[i]);
  return s;
}

export type TopOfBook = { bid: number | null; bidQty: number; ask: number | null; askQty: number };

export function topOfBook(orders: Order[]): TopOfBook {
  let bid: number | null = null;
  let ask: number | null = null;
  for (const o of orders) {
    if (o.side === "B" && (bid === null || o.price > bid)) bid = o.price;
    if (o.side === "S" && (ask === null || o.price < ask)) ask = o.price;
  }
  const sum = (side: Side, p: number | null) =>
    p === null ? 0 : orders.filter((o) => o.side === side && o.price === p).reduce((a, o) => a + o.qty, 0);
  return { bid, bidQty: sum("B", bid), ask, askQty: sum("S", ask) };
}

export type DepthLevel = { price: number; bid: number; ask: number };

export function depth(orders: Order[], minPrice: number, maxPrice: number): DepthLevel[] {
  const levels: DepthLevel[] = [];
  for (let p = maxPrice; p >= minPrice; p--) {
    const at = orders.filter((o) => o.price === p);
    levels.push({
      price: p,
      bid: at.filter((o) => o.side === "B").reduce((a, o) => a + o.qty, 0),
      ask: at.filter((o) => o.side === "S").reduce((a, o) => a + o.qty, 0),
    });
  }
  return levels;
}

export function describeEvent(ev: BookEvent): string {
  switch (ev.type) {
    case "A": return `Add ${ev.side === "B" ? "buy" : "sell"} #${ev.id}: ${ev.qty} at ${ev.price}`;
    case "X": return `Cancel ${ev.qty} from #${ev.id}`;
    case "E": return `Execute ${ev.qty} against #${ev.id}`;
    case "U": return `Replace #${ev.id} with #${ev.newId}: ${ev.qty} at ${ev.price}`;
  }
}

/** The declared synthetic sequence shown on the site. */
export const SYNTHETIC_EVENTS: BookEvent[] = [
  { type: "A", id: 1, side: "B", price: 99, qty: 300 },
  { type: "A", id: 2, side: "S", price: 101, qty: 200 },
  { type: "A", id: 3, side: "B", price: 98, qty: 150 },
  { type: "A", id: 4, side: "S", price: 102, qty: 250 },
  { type: "A", id: 5, side: "B", price: 99, qty: 100 },
  { type: "X", id: 3, qty: 150 },
  { type: "E", id: 2, qty: 120 },
  { type: "E", id: 2, qty: 80 },
  { type: "U", id: 5, newId: 6, price: 100, qty: 180 },
  { type: "A", id: 7, side: "S", price: 101, qty: 120 },
  { type: "X", id: 1, qty: 100 },
];

export const PRICE_RANGE = { min: 97, max: 103 } as const;
