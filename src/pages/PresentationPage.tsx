import { useState } from 'react';
import {
  Download, ExternalLink, Sparkles,
  ArrowLeft, ArrowRight, ShieldCheck, Maximize2
} from 'lucide-react';

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "LegalMetriX — AI Packaging Compliance Suite",
      subtitle: "Smart India Hackathon 2024 • Ministry of Consumer Affairs",
      tag: "Autonomous Compliance & Enforcement",
      boxes: [
        { title: "360° Single-Clip Scan", desc: "Autonomous continuous video recording with Laplacian blur filtering and automatic angle extraction." },
        { title: "Statutory 100-Point Engine", desc: "Evaluates mandatory declarations under Legal Metrology (Packaged Commodities) Rules, 2011." },
        { title: "Live Cloud Platform", desc: "Fullstack FastAPI + React PWA live at legal-metrology-dist-three.vercel.app." }
      ]
    },
    {
      title: "The Problem: Regulatory Enforcement Challenges",
      subtitle: "Why manual inspection fails across modern retail & e-commerce",
      tag: "SIH Problem Analysis",
      boxes: [
        { title: "Severe Officer Shortage", desc: "Over 100 Crore+ packaged products enter Indian retail daily vs limited enforcement staff." },
        { title: "Multi-Surface Blindspots", desc: "Mandatory declarations are scattered across Front, Back, Left & Right panels." },
        { title: "Black-Box AI Limitations", desc: "Traditional OCR tools lack coordinate evidence and legal citation transparency." }
      ]
    },
    {
      title: "Our Solution: LegalMetriX AI Platform",
      subtitle: "End-to-End Autonomous Regulatory Compliance Pipeline",
      tag: "Innovation Architecture",
      boxes: [
        { title: "360° Continuous Video Scan", desc: "One-pass recording with live angular HUD guidance and blur elimination." },
        { title: "Multimodal Evidence Fusion", desc: "PaddleOCR + Gemini Vision cross-verification across all packaging surfaces." },
        { title: "Court-Ready Certified Dossiers", desc: "Official Tricolor inspection certificates with bounding-box coordinate proof." }
      ]
    },
    {
      title: "Core Technical Innovation: 360° Single-Clip Scanner",
      subtitle: "Seamless multi-surface capture without manual photo snapping",
      tag: "Core Differentiator",
      boxes: [
        { title: "Laplacian Sharpness Filter", desc: "Samples 24-36 frames, discarding motion blur via Var(Laplacian) scoring." },
        { title: "Surface Clustering", desc: "Clusters rotation angles into Front, Right, Back, Left, Top, and Base." },
        { title: "360° Coverage Matrix", desc: "Displays 5/6 surfaces verified; unseen surfaces trigger 'Needs Review'." }
      ]
    },
    {
      title: "Mandatory Declarations & Readability Analysis",
      subtitle: "Auditing 10 statutory declarations under Rule 6 and Rule 12 (LMR 2011)",
      tag: "LMR 2011 Compliance",
      boxes: [
        { title: "10 Mandatory Declarations", desc: "Product Name, MRP ₹, Net Qty, Mfg Name & Address, Dates, Expiry, Care, Origin, FSSAI." },
        { title: "Font-Size & Contrast Index", desc: "Character height ratio estimation and 94% visual contrast verification." },
        { title: "PDP Conspicuous Placement", desc: "Evaluates principal display panel grouping without deceptive overlaps." }
      ]
    },
    {
      title: "Explainable 3-State Verdict & 100-Point Scoring",
      subtitle: "Eliminating false accusations through evidentiary regulatory logic",
      tag: "Statutory Logic",
      boxes: [
        { title: "COMPLIANT (85-100 pts)", desc: "All mandatory declarations verified in statutory metric units and taxes." },
        { title: "NEEDS REVIEW (55-84 pts)", desc: "Partially obscured angle routed to officer queue without false penalty." },
        { title: "NON-COMPLIANT (<50 pts)", desc: "Conclusive evidence of missing MRP, deceptive units, or expired commodity." }
      ]
    },
    {
      title: "Enforcement Dashboard & Certified PDF Reports",
      subtitle: "Real-time market analytics and administrative oversight",
      tag: "Administrative Suite",
      boxes: [
        { title: "Live Audit Stream", desc: "Instant logging of retail market inspections with officer ID and timestamps." },
        { title: "Violation Trends", desc: "Real-time charts tracking MRP, Net Quantity, and Manufacturer Address breaches." },
        { title: "Role-Based Access", desc: "Dedicated portals for Field Inspectors, Supervisors, and State Administrators." }
      ]
    },
    {
      title: "Why LegalMetriX Wins: Competitive Differentiators",
      subtitle: "Engineered for real-world government enforcement deployment",
      tag: "Competitive Edge",
      boxes: [
        { title: "One Continuous 360° Clip", desc: "No tedious 6-photo manual capture; automatic blur suppression." },
        { title: "3-State Regulatory Logic", desc: "Zero false-positive violations on partially visible product panels." },
        { title: "Field Officer Ready", desc: "Multilingual (EN, HI, TE), Offline IndexedDB sync, and CSV data exports." }
      ]
    },
    {
      title: "Live Demonstration & System Verification",
      subtitle: "5-step workflow from camera rotation to certified inspection PDF",
      tag: "Live Demo",
      boxes: [
        { title: "Step 1-2: Capture", desc: "Live 360° camera rotation with angle guidance HUD." },
        { title: "Step 3-4: AI Fusion", desc: "Auto-fills 10 declarations with bounding-box evidence highlights." },
        { title: "Step 5: Official PDF", desc: "Generates Tricolor SIH inspection certificate with statutory citations." }
      ]
    },
    {
      title: "National Scalability, Impact & Future Roadmap",
      subtitle: "Transforming consumer protection across India",
      tag: "Future Vision",
      boxes: [
        { title: "E-Commerce Scraper Bot", desc: "Autonomous crawler validating Amazon, Blinkit, and Zepto product listings." },
        { title: "On-Device Edge AI", desc: "Quantized ONNX models running on rugged handheld officer terminals." },
        { title: "National Registry", desc: "Centralized sync across 28 State Legal Metrology Directorates." }
      ]
    }
  ];

  const slide = slides[currentSlide];

  return (
    <div className="flex flex-col min-h-full pb-24 sm:pb-12 bg-slate-950 text-white">
      {/* ── Top Header Controls Bar ──────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">LegalMetriX SIH 2024 Slide Deck</h2>
            <span className="text-[11px] text-blue-300 font-mono">10 Presentation Slides</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/LegalMetriX_SIH_Presentation.pptx"
            download="LegalMetriX_SIH_Presentation.pptx"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download size={14} /> Download .PPTX File
          </a>

          <a
            href="/presentation.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Maximize2 size={14} /> Fullscreen Slide Deck <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* ── Main Slide Viewer Stage ──────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 w-full flex-1 flex flex-col justify-between">
        
        {/* Slide Canvas Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 flex-1 flex flex-col justify-between">
          
          {/* Slide Top Metadata */}
          <div className="flex justify-between items-start gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-extrabold uppercase tracking-wider">
                <Sparkles size={11} className="text-amber-400" /> {slide.tag}
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-2">
                {slide.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {slide.subtitle}
              </p>
            </div>

            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-xl">
              Slide {currentSlide + 1} of {slides.length}
            </span>
          </div>

          {/* Slide Content Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto">
            {slide.boxes.map((b, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border bg-slate-950/70 space-y-2 flex flex-col justify-between ${
                  idx === 0
                    ? 'border-blue-500/40 shadow-blue-500/5 shadow-lg'
                    : idx === 1
                    ? 'border-amber-500/40 shadow-amber-500/5 shadow-lg'
                    : 'border-emerald-500/40 shadow-emerald-500/5 shadow-lg'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block mb-1 ${
                    idx === 0 ? 'text-blue-400' : idx === 1 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    Section 0{idx + 1}
                  </span>
                  <h3 className="font-extrabold text-white text-sm">{b.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
                  {b.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Slide Footer */}
          <div className="flex justify-between items-center border-t border-slate-800 pt-4 text-xs text-slate-500 font-mono">
            <span>Team LegalMetriX • Smart India Hackathon 2024</span>
            <span>Ministry of Consumer Affairs</span>
          </div>
        </div>

        {/* ── Slide Navigation Bar ────────────────────────────────────────── */}
        <div className="flex justify-between items-center pt-6">
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              currentSlide === 0
                ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer border border-slate-700'
            }`}
          >
            <ArrowLeft size={14} /> Previous Slide
          </button>

          {/* Dot Indicators */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentSlide === idx
                    ? 'bg-blue-500 w-6'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                title={`Go to Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlide === slides.length - 1}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              currentSlide === slides.length - 1
                ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-lg shadow-blue-500/20'
            }`}
          >
            Next Slide <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
