/** Sakura petals drifting down a hero. Decorative only; hidden when motion is reduced. */
const PETALS = [
  { x: "6%", d: "11s", delay: "0s", drift: "4rem" },
  { x: "18%", d: "14s", delay: "-6s", drift: "-2rem" },
  { x: "31%", d: "10s", delay: "-3s", drift: "5rem" },
  { x: "44%", d: "13s", delay: "-9s", drift: "2rem" },
  { x: "57%", d: "12s", delay: "-1s", drift: "-3rem" },
  { x: "68%", d: "15s", delay: "-11s", drift: "4rem" },
  { x: "79%", d: "10.5s", delay: "-5s", drift: "-2rem" },
  { x: "90%", d: "13.5s", delay: "-8s", drift: "3rem" },
  { x: "12%", d: "12.5s", delay: "-10s", drift: "3rem" },
  { x: "38%", d: "15.5s", delay: "-13s", drift: "-4rem" },
  { x: "63%", d: "11.5s", delay: "-7s", drift: "2rem" },
  { x: "85%", d: "14.5s", delay: "-2s", drift: "-3rem" },
] as const;

export function Petals() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {PETALS.map((p) => (
        <span
          key={p.x}
          className="petal"
          style={{ "--x": p.x, "--d": p.d, "--delay": p.delay, "--drift": p.drift } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
