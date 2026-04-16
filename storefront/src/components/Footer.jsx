export default function Footer() {
 return (
   <footer className="bg-background border-t border-white/10 pt-20 pb-10 px-6 md:px-[8vw]">
     <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
       <div className="flex flex-col items-start gap-4">
         <a href="#top" className="group inline-flex flex-col items-start pt-1.5 mb-2">
           <span className="font-bebas text-[24px] tracking-[8px] text-white leading-none uppercase">LOGISTIC</span>
           <div className="w-full h-px bg-accent-red my-0.5 transition-transform duration-300 group-hover:scale-x-110 origin-left" />
           <span className="font-bebas text-[24px] tracking-[8px] text-accent-red leading-none uppercase">APP</span>
         </a>
         <p className="font-inter text-text-secondary text-[14px]">Unified logistics operations for admin, operations, and driver teams.</p>
         <p className="font-inter text-text-muted text-[12px] mt-4">Built for dispatch-heavy businesses.</p>
       </div>

       <div className="flex flex-col gap-4">
         <h4 className="font-bebas text-[18px] tracking-[2px] text-white mb-2">PRODUCT</h4>
         <a href="#workflow" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">Workflow</a>
         <a href="#roles" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">Role Dashboards</a>
         <a href="#capabilities" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">Capabilities</a>
         <a href="#faq" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">FAQs</a>
       </div>

       <div className="flex flex-col gap-4">
         <h4 className="font-bebas text-[18px] tracking-[2px] text-white mb-2">DASHBOARDS</h4>
         <a href="#roles" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">Operations Dashboard</a>
         <a href="#roles" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">Admin Dashboard</a>
         <a href="#roles" className="font-inter text-text-secondary text-[14px] hover:text-white transition-colors">Driver Dashboard</a>
       </div>

       <div className="flex flex-col gap-4">
         <h4 className="font-bebas text-[18px] tracking-[2px] text-white mb-2">MODULES</h4>
         <p className="font-inter text-text-secondary text-[14px]">Dispatch Board</p>
         <p className="font-inter text-text-secondary text-[14px]">Routes & Tracking</p>
         <p className="font-inter text-text-secondary text-[14px]">Proof of Delivery</p>
         <p className="font-inter text-text-secondary text-[14px]">Billing & Wallet</p>
       </div>
     </div>
     <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
       <p className="font-inter text-text-muted text-[12px]">© {new Date().getFullYear()} Logistic App. All rights reserved.</p>
       <p className="font-inter text-text-muted text-[12px] uppercase tracking-[2px]">ADMIN · OPERATIONS · DRIVER</p>
     </div>
   </footer>
 );
}
