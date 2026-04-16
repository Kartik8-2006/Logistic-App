"use client";
import { motion } from "framer-motion";
import { Building2, LayoutDashboard, Truck } from "lucide-react";

const ROLE_DASHBOARDS = [
  {
    id: "dispatch",
    badge: "DISPATCH LAYER",
    title: "Orders Don't Self-Assign",
    icon: LayoutDashboard,
    modules: ["Manual handoffs waste time", "Drivers aren't on the same page", "Loads sit unassigned for hours"],
    metrics: ["Solution", "Live bid market mechanics", "Sub-minute assignment cycles"],
  },
  {
    id: "tracking",
    badge: "VISIBILITY LAYER",
    title: "Blind Spots Kill Margins",
    icon: Building2,
    modules: ["Route changes aren't communicated", "Delays discovered too late", "No proactive alerts or rerouting"],
    metrics: ["Solution", "Real-time end-to-end tracking", "System-driven exception handling"],
  },
  {
    id: "settlement",
    badge: "SETTLEMENT LAYER",
    title: "Payments Are Stuck",
    icon: Truck,
    modules: ["POD approval delays cash flow", "Manual invoice reconciliation", "Driver earnings opacity"],
    metrics: ["Solution", "POD → Payout in real-time", "Full transparency, faster cash"],
  },
];

export default function Collection() {
  return (
    <section id="roles" className="relative overflow-hidden bg-background px-6 py-20 md:px-[8vw] md:py-30 flex flex-col items-center">
      <div className="absolute inset-0">
        <img
          src="/assets/hero/ops-bottlenecks-bg.jpg"
          alt="Freight truck on mountain highway"
          className="h-full w-full object-cover object-center brightness-60"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-black/45" />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center">
        <p className="font-inter text-[11px] tracking-[5px] text-accent-red uppercase text-center mb-6">THE THREE CORE PROBLEMS</p>
        <h2 className="font-bebas text-[48px] md:text-[80px] leading-none mb-5 tracking-[-2px] uppercase bg-[linear-gradient(180deg,#FFFFFF_0%,#7F7F7F_100%)] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
          LOGISTICS OPS
          <br />
          BREAKS AT SPEED
        </h2>
        <p className="font-inter text-center text-white/65 text-[15px] max-w-2xl mb-16">
          Every logistics company faces these three bottlenecks. Logistics App solves them at the system level so you don't waste time firefighting.
        </p>

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLE_DASHBOARDS.map((role, index) => {
            const Icon = role.icon;
            return (
              <motion.article
                key={role.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.75, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="group border border-white/8 bg-black/20 p-7 hover:border-accent-red/40 hover:-translate-y-1 transition-all duration-500"
              >
                <div className="flex items-center justify-between mb-6">
                  <p className="font-inter text-[10px] tracking-[3px] uppercase text-accent-red">{role.badge}</p>
                  <div className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/80 group-hover:text-white group-hover:border-white/40 transition-colors">
                    <Icon size={18} />
                  </div>
                </div>

                <h3 className="font-bebas text-[36px] tracking-[1px] text-white leading-none mb-5">{role.title}</h3>

                <div className="space-y-2 mb-6">
                  {role.modules.map((module) => (
                    <p key={module} className="font-inter text-[14px] text-white/80">
                      {module}
                    </p>
                  ))}
                </div>

                <div className="pt-5 border-t border-white/10 space-y-2">
                  {role.metrics.map((metric) => (
                    <p key={metric} className="font-inter text-[12px] tracking-[1px] uppercase text-white/60">
                      {metric}
                    </p>
                  ))}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
