"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

const DAY = 86_400_000;
const DAYS = 14;

/** UTC day boundaries keep the chart consistent with the UTC ledger table. */
function dayStart(time: number) {
  const date = new Date(time);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function shortDay(time: number) {
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(time));
}

/**
 * A visual summary of confirmed donations in the last 14 days. It reads the
 * same transaction rows as the ledger and is hidden from assistive technology:
 * the ledger remains the accessible source of truth. Bars animate only when
 * motion is enabled.
 *
 * The day anchor is captured after mount so rendering stays deterministic and
 * a long-lived tab does not shift buckets between renders.
 */
export function ActivityChart({ items }: { items: { timestamp: string; status: string }[] }) {
  const [today, setToday] = useState(0);

  useEffect(() => {
    const sync = () => setToday(dayStart(Date.now()));
    sync();
    const timer = window.setInterval(sync, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const start = today || 0;
  const buckets = Array.from({ length: DAYS }, (_, index) => ({
    start: start - (DAYS - 1 - index) * DAY,
    count: 0,
  }));

  if (today) {
    for (const item of items) {
      if (item.status !== "CONFIRMED") continue;
      const time = Date.parse(item.timestamp);
      if (!Number.isFinite(time)) continue;
      const index = Math.round((dayStart(time) - buckets[0].start) / DAY);
      if (index >= 0 && index < DAYS) buckets[index].count += 1;
    }
  }

  const max = Math.max(1, ...buckets.map(bucket => bucket.count));

  return <div className={`activity-chart${today ? "" : " is-pending"}`} aria-hidden="true">
    <div className="activity-bars">
      {buckets.map((bucket, index) => <span
        key={index}
        className={bucket.count ? "has-value" : undefined}
        title={today ? `${shortDay(bucket.start)} · ${bucket.count}` : undefined}
        style={{ "--bar": `${Math.max(bucket.count ? 16 : 5, (bucket.count / max) * 100)}%`, "--i": index } as CSSProperties}
      ><i /></span>)}
    </div>
    <div className="activity-axis">
      <span>{today ? shortDay(buckets[0].start) : ""}</span>
      <span>{today ? shortDay(buckets[DAYS - 1].start) : ""}</span>
    </div>
  </div>;
}
