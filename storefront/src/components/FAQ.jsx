"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

const FAQ_ITEMS = [
 { question: "CAN OPERATIONS TRACK LOADS BY STATUS?", answer: "Yes. Dispatch Board and Routes & Tracking support states like Assigned, Loading, In Transit, Delivered, Unassigned, and delay-focused route filters." },
 { question: "HOW DOES POD APPROVAL AFFECT PAYOUT?", answer: "Proof of Delivery workflows are linked with billing and driver wallet settlements. Pending or rejected POD can hold payout until approved evidence is uploaded." },
 { question: "DO DRIVERS GET LOADS ONLY BY ASSIGNMENT?", answer: "No. Driver Dashboard supports both direct load assignment and Live Bids so drivers can compete for eligible lanes during open windows." },
 { question: "CAN ADMINS CONTROL FLEET AND HUB ACCESS?", answer: "Yes. Admin Dashboard manages Fleet, Drivers, Warehouses/Hubs, and settings-level controls for access and operational policy." },
 { question: "IS EARNINGS VISIBILITY AVAILABLE FOR DRIVERS?", answer: "Yes. Wallet module provides payment history, payout methods, pending settlements, and earning summaries tied to completed delivery records." },
 { question: "WILL THIS FIT A GROWING MULTI-TEAM LOGISTICS BUSINESS?", answer: "That is exactly the use case. The platform is designed so admin, operations, and driver teams work in dedicated views over the same live data layer." },
];

export default function FAQ() {
 const [openIdx, setOpenIdx] = useState(null);
 return (
   <section id="faq" className="py-24 px-6 md:px-[8vw] bg-background">
     <div className="max-w-3xl mx-auto">
       <h2 className="font-bebas text-[48px] md:text-[64px] tracking-[2px] leading-none mb-16 text-center">
         FREQUENTLY ASKED <span className="text-accent-red">QUESTIONS</span>
       </h2>
       <div className="space-y-4">
         {FAQ_ITEMS.map((item, i) => (
           <div key={i} className="border border-white/5 bg-white/2 overflow-hidden">
             <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full flex items-center justify-between p-6 md:p-8 text-left">
               <span className="font-bebas text-[20px] md:text-[24px] tracking-[2px]">{item.question}</span>
               <motion.div animate={{ rotate: openIdx === i ? 45 : 0 }} transition={{ duration: 0.3 }}>
                 <Plus className="w-6 h-6 text-accent-red" />
               </motion.div>
             </button>
             <AnimatePresence>
               {openIdx === i && (
                 <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.4}}>
                   <div className="px-6 md:px-8 pb-8 font-inter text-text-secondary text-[15px] leading-relaxed">{item.answer}</div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
         ))}
       </div>
     </div>
   </section>
 );
}

