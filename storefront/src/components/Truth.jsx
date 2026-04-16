"use client";
import { motion } from "framer-motion";

export default function Truth() {
 return (
   <section className="relative overflow-hidden bg-background px-6 py-20 md:px-[8vw] md:py-30 flex flex-col md:flex-row gap-10 md:gap-[8vw]">
      <div className="absolute inset-0">
        <img
          src="/assets/hero/how-it-works-scale-bg.jpg"
          alt="Freight trucks moving on highway"
          className="h-full w-full object-cover object-center brightness-80"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-black/45" />
      </div>

      <motion.div initial={{opacity:0,x:-40}} whileInView={{opacity:1,x:0}} viewport={{once:true,margin:"-20%"}} transition={{duration:0.8}} className="relative z-10 flex-1">
       <div className="font-inter text-[11px] tracking-[5px] text-accent-red uppercase mb-8">HOW IT WORKS AT SCALE</div>
       <h2 className="font-bebas text-[44px] md:text-[72px] text-white leading-[0.92] mb-8">
        CONNECTED OPS,
        <br />
        NOT CHAOS.
       </h2>
      <div className="w-15 h-0.5 bg-accent-red mb-8" />
      <div className="font-inter text-[16px] text-white/85 leading-relaxed max-w-120 space-y-6">
         <p>Logistics App unifies dispatch, tracking, and settlement so there's one shared truth across your entire operation.</p>
         <p>When a driver bids on load, operations sees it instantly. When POD uploads, billing processes it. When revenue settles, everyone knows the status in real-time.</p>
         <p>No reconciliation meetings. No "I didn't know that happened." Just one system, one source of truth, connected workflows.</p>
       </div>
     </motion.div>

     <motion.div initial={{opacity:0,x:40}} whileInView={{opacity:1,x:0}} viewport={{once:true,margin:"-20%"}} transition={{duration:0.8}} className="relative z-10 flex-1 flex flex-col justify-center">
       <div className="bg-black/35 border border-white/20 backdrop-blur-[2px] p-8 md:p-12 flex flex-col gap-6">
          <div className="border border-white/8 bg-black/20 p-5">
           <div className="font-inter text-[11px] tracking-[3px] text-accent-red uppercase mb-2">DISPATCH TO DRIVER</div>
           <div className="font-inter font-semibold text-[16px] text-white">Loads broadcast live. Drivers bid instantly. No manual phone-tag coordination.</div>
         </div>

         <div className="border border-white/8 bg-black/20 p-5">
           <div className="font-inter text-[11px] tracking-[3px] text-accent-gold uppercase mb-2">PICKUP TO DELIVERY</div>
           <div className="font-inter font-semibold text-[16px] text-white">Real-time tracking, alerts, and exception handling tell you problems before they cascade.</div>
         </div>

         <div className="border border-white/8 bg-black/20 p-5">
           <div className="font-inter text-[11px] tracking-[3px] text-emerald-300 uppercase mb-2">POD TO PAYOUT</div>
           <div className="font-inter font-semibold text-[16px] text-white">Upload proof, trigger settlement. Driver gets paid. No reconciliation bottleneck.</div>
         </div>
       </div>
       <h3 className="font-bebas text-[22px] tracking-[3px] text-accent-red text-center mt-8">EVERY HANDOFF TRACKED</h3>
     </motion.div>
   </section>
 );
}
