"use client";
import { motion } from "framer-motion";

const STEPS = [
  {
    number: "01",
    title: "LOAD CREATED, NOT STUCK",
    desc: "Dispatch post load instantly. Drivers see it live. Bids come in seconds, not hours. No unassigned backlog.",
  },
  {
    number: "02",
    title: "DRIVER COMMITS INSTANTLY",
    desc: "Live bid mechanics let drivers commit immediately. Reduces \"are you available?\" phone calls by 90%. Clear acceptance, clear commitment.",
  },
  {
    number: "03",
    title: "ROUTE TRACKED, DELAYS PREVENTED",
    desc: "Real-time GPS + intelligent alerts catch delays before they blow up delivery windows. Rerouting happens fast. Customers stay informed.",
  },
  {
    number: "04",
    title: "POD UNLOCKS PAYMENT INSTANTLY",
    desc: "Delivery proof uploaded → system processes → driver paid. No reconciliation bottleneck. Settlement happens same-day, not weeks later.",
  },
];

export default function HowItWorks() {
  return (
    <section id="workflow" className="bg-background px-6 py-24 md:px-[8vw] border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <p className="font-inter text-[11px] tracking-[5px] text-accent-red uppercase mb-6">THE LOAD LIFECYCLE</p>
            <h2 className="font-bebas text-[48px] md:text-[80px] leading-none text-white tracking-[-1px]">
              FROM DISPATCH <span className="text-white/20">TO REVENUE,</span>
              <br />
              <span className="text-white">ZERO FRICTION</span>
            </h2>
          </div>
          <p className="font-inter text-text-secondary text-[16px] max-w-md">
            This is how you eliminate the manual handoffs, delays, and reconciliation chaos that bleed margins and frustrate drivers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-px bg-white/10 z-0" />
          
          {STEPS.map((step, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.6, delay: i * 0.2 }}
              className="relative z-10 flex flex-col"
            >
              <div className="w-20 h-20 rounded-full bg-[#111] border border-accent-red flex items-center justify-center font-bebas text-[36px] text-accent-red mx-auto lg:mx-0 mb-8 shadow-[0_0_30px_rgba(232,0,13,0.15)]">
                {step.number}
              </div>
              <h3 className="font-bebas text-[28px] text-white tracking-[2px] mb-4 text-center lg:text-left">{step.title}</h3>
              <p className="font-inter text-[15px] text-text-secondary leading-relaxed text-center lg:text-left">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
