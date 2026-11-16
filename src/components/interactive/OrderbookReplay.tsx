"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { PRICE_RANGE, SYNTHETIC_EVENTS, depth, describeEvent, replay, topOfBook } from "@/lib/demo-models/orderbook";
import { chartColors } from "@/lib/themes";
import styles from "./demos.module.css";

const tick = { fontSize: 13, fill: chartColors.axis, fontFamily: "var(--font-mono), monospace" };

export function OrderbookReplay() {
  const n = SYNTHETIC_EVENTS.length;
  const [step, setStep] = useState(0); // number of events applied
  const state = useMemo(() => replay(SYNTHETIC_EVENTS, step), [step]);
  const top = topOfBook(state.orders);
  const levels = depth(state.orders, PRICE_RANGE.min, PRICE_RANGE.max);
  const history = useMemo(
    () =>
      Array.from({ length: n + 1 }, (_, i) => {
        const t = topOfBook(replay(SYNTHETIC_EVENTS, i).orders);
        return { i, bid: t.bid, ask: t.ask };
      }),
    [n],
  );
  const shown = history.slice(0, step + 1);
  const sorted = [...state.orders].sort((a, b) => (a.side === b.side ? b.price - a.price : a.side === "S" ? -1 : 1));

  return (
    <div className={styles.book}>
      <div className={styles.bookControls}>
        <button type="button" className="btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Previous
        </button>
        <button type="button" className="btn" onClick={() => setStep((s) => Math.min(n, s + 1))} disabled={step === n}>
          Next message
        </button>
        <button type="button" className="btn" onClick={() => setStep(0)} disabled={step === 0}>
          Reset
        </button>
        <p className={styles.bookStatus} aria-live="polite">
          {step === 0 ? "Empty book. No messages applied." : `Message ${step} of ${n}: ${describeEvent(SYNTHETIC_EVENTS[step - 1])}.`}
        </p>
      </div>

      <div className={styles.bookGrid}>
        <div>
          <h3 className={styles.demoHead}>Messages</h3>
          <ol className={styles.events}>
            {SYNTHETIC_EVENTS.map((e, i) => (
              <li key={i} aria-current={i === step - 1 ? "step" : undefined} className={i < step ? styles.applied : undefined}>
                <span className="mono">{e.type}</span> {describeEvent(e)}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className={styles.demoHead}>Top of book</h3>
          <dl className={styles.tob}>
            <div><dt>Best bid</dt><dd className="mono">{top.bid ?? "none"}{top.bid !== null ? ` × ${top.bidQty}` : ""}</dd></div>
            <div><dt>Best ask</dt><dd className="mono">{top.ask ?? "none"}{top.ask !== null ? ` × ${top.askQty}` : ""}</dd></div>
          </dl>
          <h3 className={styles.demoHead}>Depth by price tick</h3>
          <div className={styles.depthChart} role="img" aria-label={`Depth chart. ${levels.filter((l) => l.bid || l.ask).map((l) => `price ${l.price}: ${l.bid ? `bid ${l.bid}` : ""}${l.ask ? `ask ${l.ask}` : ""}`).join("; ") || "empty"}.`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levels} layout="vertical" margin={{ top: 4, right: 16, bottom: 22, left: 4 }} barCategoryGap={4}>
                <CartesianGrid stroke={chartColors.grid} horizontal={false} />
                <XAxis type="number" domain={[0, 400]} ticks={[0, 100, 200, 300, 400]} tick={tick} stroke={chartColors.axis} label={{ value: "quantity", position: "insideBottomRight", offset: -14, fontSize: 13, fill: chartColors.axis }} />
                <YAxis type="category" dataKey="price" tick={tick} stroke={chartColors.axis} width={40} />
                <Bar dataKey="bid" stackId="q" fill={chartColors.series1} isAnimationActive={false} name="Bids" />
                <Bar dataKey="ask" stackId="q" fill={chartColors.series2} isAnimationActive={false} name="Asks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className={styles.legend}>
            <span><i className={styles.swatch} style={{ background: chartColors.series1 }} /> bids (buy)</span>
            <span><i className={`${styles.swatch} ${styles.hatch}`} style={{ background: chartColors.series2 }} /> asks (sell)</span>
          </p>
        </div>

        <div>
          <h3 className={styles.demoHead}>Active orders</h3>
          <table className="data">
            <thead>
              <tr><th>Order</th><th>Side</th><th className="num">Price</th><th className="num">Qty</th></tr>
            </thead>
            <tbody>
              {sorted.length ? (
                sorted.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">#{o.id}</td>
                    <td>{o.side === "B" ? "buy" : "sell"}</td>
                    <td className="num">{o.price}</td>
                    <td className="num">{o.qty}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="muted">No active orders.</td></tr>
              )}
            </tbody>
          </table>
          <h3 className={styles.demoHead}>Best prices by message</h3>
          <div className={styles.stepChart} role="img" aria-label="Step chart of best bid and best ask after each applied message.">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={shown} margin={{ top: 8, right: 12, bottom: 22, left: 4 }}>
                <CartesianGrid stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="i" type="number" domain={[0, n]} ticks={[0, 3, 6, 9, n]} tick={tick} stroke={chartColors.axis} label={{ value: "message", position: "insideBottomRight", offset: -14, fontSize: 13, fill: chartColors.axis }} />
                <YAxis domain={[97, 103]} ticks={[98, 100, 102]} tick={tick} stroke={chartColors.axis} width={40} />
                <Line type="stepAfter" dataKey="bid" stroke={chartColors.series1} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
                <Line type="stepAfter" dataKey="ask" stroke={chartColors.series2} strokeWidth={2} strokeDasharray="7 4" dot={false} isAnimationActive={false} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {state.error ? <p role="alert">Reducer error: {state.error}</p> : null}
    </div>
  );
}
