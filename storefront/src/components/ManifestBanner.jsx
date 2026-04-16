export default function ManifestBanner() {
 return (
   <section className="relative w-full aspect-auto min-h-[60vw] md:aspect-video md:min-h-0 bg-[#111111] flex flex-col justify-end items-center pb-[8vw] md:pb-0 md:justify-center md:items-end overflow-hidden">
     <div className="absolute inset-0">
       <img
         src="/assets/hero/go-live-logistics-bg.jpg"
         alt="Delivery vehicle in urban traffic"
         className="h-full w-full object-cover object-center brightness-80"
       />
       <div className="absolute inset-0 bg-black/40" />
       <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-black/45" />
     </div>
     <div className="w-[85%] md:w-[38%] text-center md:text-left z-10 flex flex-col items-center md:items-start md:-ml-[10%]">
       <p className="font-inter font-normal uppercase tracking-wider text-[rgba(255,255,255,0.65)] text-[clamp(13px,1.2vw,18px)] mb-2">Deploy your logistics command layer.</p>
       <h2 className="font-bebas text-white text-[clamp(32px,4.5vw,72px)] leading-none mb-4 md:mb-6">Go Live With Logistic App.</h2>
       <a href="#capabilities" className="font-inter font-medium text-white border-b border-white hover:text-accent-red hover:border-accent-red transition-colors pb-1 uppercase text-sm tracking-wide inline-block">
         Explore Capabilities &rarr;
       </a>
     </div>
   </section>
 );
}
