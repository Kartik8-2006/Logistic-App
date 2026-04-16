"use client";
import { motion } from "framer-motion";
import { BarChart3, ClipboardCheck, Gauge, LayoutDashboard, Route, Wallet, Warehouse } from "lucide-react";

const FEATURES = [
  {
    icon: <LayoutDashboard className="w-8 h-8 text-accent-red" />,
    title: "Live Bid Market",
    desc: "Loads broadcast in real-time. Drivers bid instantly. No phone calls, no delays. Autonomous assignment replaces manual orchestration.",
  },
  {
    icon: <Route className="w-8 h-8 text-white" />,
    title: "Real-Time Route Control",
    desc: "GPS tracking + map view across all active routes. Detect delays early, reroute dynamically, prevent customer escalations.",
  },
  {
    icon: <ClipboardCheck className="w-8 h-8 text-accent-gold" />,
    title: "Instant POD-to-Payout",
    desc: "Upload delivery proof → immediate payment processing. No reconciliation delays. Driver earnings clear and on-schedule.",
  },
  {
    icon: <Wallet className="w-8 h-8 text-accent-red" />,
    title: "Driver Transparency",
    desc: "Drivers see load details, complete visibility into earnings, payout schedules, and performance metrics. Reduce friction, improve retention.",
  },
  {
    icon: <Gauge className="w-8 h-8 text-white" />,
    title: "Proactive Alert System",
    desc: "HOS violations, fuel spend anomalies, ETA misses, overdue invoices—system alerts you before problems cascade.",
  },
  {
    icon: <Warehouse className="w-8 h-8 text-accent-gold" />,
    title: "Unified Fleet & Compliance",
    desc: "Fleet health, driver compliance, hub management, and role-based access all from one control surface. No silos.",
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-accent-red" />,
    title: "Unified Metrics & Reporting",
    desc: "Load lifecycle KPIs, on-time performance, invoice aging, revenue trends, and fleet utilization all connected end-to-end.",
  },
];

export default function Features() {
  return (
    <section id="capabilities" className="bg-surface px-6 py-24 md:px-[8vw] border-t border-white/5">
      <div className="flex flex-col items-center mb-16 text-center">
        <p className="font-inter text-[11px] tracking-[5px] text-accent-red uppercase mb-6">BUILT FOR REAL OPERATIONS</p>
        <h2 className="font-bebas text-[48px] md:text-[72px] leading-none mb-6">SOLVE LOGISTICS PROBLEMS AT SCALE.</h2>
        <p className="font-inter text-text-secondary text-[16px] max-w-2xl mx-auto">
          Seven core capabilities that eliminate the dispatch chaos, visibility gaps, and settlement delays plaguing your operation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((feat, i) => (
          <motion.div 
            key={feat.title} 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-10%" }} 
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="bg-background border border-white/5 p-8 flex flex-col items-start hover:border-accent-red/40 transition-colors duration-300"
          >
            <div className="mb-6 p-4 bg-white/2 rounded-lg">
              {feat.icon}
            </div>
            <h3 className="font-bebas text-[28px] tracking-[1px] text-white mb-3">{feat.title}</h3>
            <p className="font-inter text-[14px] text-text-secondary leading-relaxed">
              {feat.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
