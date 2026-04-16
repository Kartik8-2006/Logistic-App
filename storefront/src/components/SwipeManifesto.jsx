"use client";
import { motion } from "framer-motion";

const PAIN_SIGNALS = [
  "Orders sit in Unassigned for hours.",
  "Drivers call for route updates and ETA changes.",
  "POD re-uploads delay settlements and payout release.",
  "Fuel spikes are noticed after the week closes.",
  "Overdue invoices pile up without clear ownership.",
];

const RESPONSE_CARDS = [
  {
    label: "INSTANT ASSIGNMENT",
    title: "No More Calling Drivers",
    points: ["Live bid system puts loads in drivers' hands", "Accept/reject in seconds, not phone calls", "Autonomous market mechanics replace manual orchestration"],
  },
  {
    label: "REAL-TIME TRACKING",
    title: "Every Load, Every Moment",
    points: ["End-to-end map visibility from pickup to delivery", "Proactive alerts before delays become problems", "Route optimization and exception handling built-in"],
  },
  {
    label: "INSTANT SETTLEMENT",
    title: "POD to Payout, No Delays",
    points: ["Proof of delivery unlocks payment immediately", "Driver earnings transparent and on-schedule", "No more invoice reconciliation bottlenecks"],
  },
];

export default function SwipeManifesto() {
  return (
    <section className="bg-background border-y border-white/5 px-6 py-20 md:px-[8vw] md:py-26">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-start">
        <div>
          <p className="font-inter text-[11px] tracking-[5px] text-accent-red uppercase mb-6">CURRENT OPERATIONS SIGNALS</p>
          <h2 className="font-bebas text-[44px] md:text-[72px] leading-[0.92] text-white mb-8">
            THE PROBLEM IS NOT
            <br />
            VOLUME. IT IS
            <br />
            VISIBILITY.
          </h2>
          <div className="space-y-3">
            {PAIN_SIGNALS.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="flex items-start gap-3 border border-white/8 bg-white/1.5 px-4 py-3"
              >
                <span className="mt-0.75 w-2 h-2 rounded-full bg-accent-red shrink-0" />
                <p className="font-inter text-[15px] text-white/80 leading-relaxed">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {RESPONSE_CARDS.map((card, index) => (
            <motion.article
              key={card.label}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.55, delay: index * 0.12 }}
              className="border border-white/12 bg-[linear-gradient(120deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.01)_100%)] p-6"
            >
            <p className="font-inter text-[10px] tracking-[3px] uppercase text-accent-red mb-3">{card.label}</p>
              <h3 className="font-bebas text-[34px] leading-none text-white tracking-[1px] mb-4">{card.title}</h3>
              <ul className="space-y-2">
                {card.points.map((point) => (
                  <li key={point} className="font-inter text-[14px] text-white/72 leading-relaxed">
                    {point}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}