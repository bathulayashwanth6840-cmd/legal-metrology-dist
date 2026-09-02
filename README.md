# LegalMetriX — Legal Metrology Compliance & Enforcement Suite

[![SIH 2024](https://img.shields.io/badge/SIH-2024-orange.svg)](https://www.sih.gov.in/)
[![Ministry of Consumer Affairs](https://img.shields.io/badge/Ministry-Consumer_Affairs-blue.svg)](https://consumeraffairs.nic.in/)
[![Live Deployment](https://img.shields.io/badge/Live_Demo-Vercel-success.svg)](https://legal-metrology-dist-three.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An officer-centric statutory compliance inspection platform built for the **Directorate of Legal Metrology, Ministry of Consumer Affairs, Food & Public Distribution (Government of India)** under the **Legal Metrology (Packaged Commodities) Rules, 2011**.

👉 **Live Application:** [https://legal-metrology-dist-three.vercel.app/](https://legal-metrology-dist-three.vercel.app/)

---

## 🏛️ System Philosophy: *"AI inside the system, not the system"*

LegalMetriX empowers enforcement officers by placing automated intelligence as an assistive verification layer while maintaining officer authority for final statutory decisions.

```
INSPECTOR (Officer #LM-204)
     ↓
INSPECTION (Session Context & Docket)
     ↓
PACKAGE + PRODUCT IDENTIFICATION (Verified vs Unverified)
     ↓
EVIDENCE COLLECTION (Multi-surface packaging & extracted parameters)
     ↓
AI ASSISTANCE (PaddleOCR + Gemini 2.5 Flash Vision parsing aid)
     ↓
RULE-BY-RULE ASSESSMENT (Deterministic LMR 2011 checks)
     ↓
INSPECTOR VERIFICATION (Officer Determination, Notes & Digital Seal)
     ↓
OFFICIAL INSPECTION REPORT (Certified PDF Dossier)
     ↓
ENFORCEMENT DATABASE (History & Traceability)
```

---

## 🚀 Key Features

### 1. 📷 Multi-Modal Packaging Capture
- **Single Image Upload**: High-resolution packaging photo analysis.
- **4-Side Multi-Panel Grid**: Front, Back, Left, and Right display surfaces.
- **Live Camera Capture**: In-browser camera capture with client-side cropping and quality grading.
- **360° Continuous Video Rotation Scanner**: Single-clip rotation capture with Laplacian blur filtering to extract sharp keyframes across all angles in 8 seconds.

### 2. ⚖️ Rule-by-Rule Statutory Assessment (LMR 2011)
Audits all 10 mandatory declarations:
1. **Maximum Retail Price (MRP)** — *Rule 6(1)(e)*
2. **Net Quantity in Standard Metric Units** — *Rule 12 & Schedule II*
3. **Manufacturer / Packer Name & Physical Address with PIN** — *Rule 6(1)(a)/(b)*
4. **Consumer Care Helpline & Email** — *Rule 6(1)(h)*
5. **Country of Origin / Made in India** — *Rule 6(1)(f)*
6. **Month & Year of Manufacture / Packing** — *Rule 6(1)(d)*
7. **Expiry / Best Before Date** — *Rule 6(1)(g)*
8. **FSSAI License (14-Digit Format Check)** — *FSSAI Act, 2006*
9. **Character Height & Display Area Ratio (≥ 2.5%)**
10. **Luminance Contrast & Placement on Principal Display Panel**

### 3. 🎯 3-State Regulatory Verdict & Actionable Findings
- 🟢 **`[COMPLIANT]`** (85–100 pts) — Verified statutory compliance.
- 🟡 **`[NEEDS REVIEW]`** (55–84 pts) — Routed to officer queue for physical verification.
- 🔴 **`[NON-COMPLIANT]`** (< 50 pts) — Conclusive statutory breach.
- **Actionable Failure Cards**: Detailed breakdown showing detected value, required statutory declaration, rule citation, root-cause reason, and corrective guidance.

### 4. ✍️ Inspector Verification & Digital Audit Seal
- Official officer decision recording (`VERIFIED`, `NEEDS REVIEW`, `UNVERIFIED`).
- Officer remarks and seized sample batch notes.
- Cryptographic digital seal with timestamp, SHA-256 audit hash, and officer badge `#LM-204`.

### 5. 📑 Court-Ready Certified Reports (PDF)
- One-click generation of official inspection dossiers with government headers, evidence photographs, verified declaration tables, and violation logs.

### 6. 🌐 Field-Ready Trilingual PWA & Offline Queue
- Instant switching between **English (🇬🇧)**, **हिन्दी (🇮🇳)**, and **తెలుగు (🇮🇳)**.
- **Offline IndexedDB Queue**: Perform audits in remote rural markets without active internet; automatically syncs when connectivity is restored.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM, Vite PWA
- **AI Vision & OCR**: Google Gemini 2.5 Flash Multimodal Vision (`google-genai`), PaddleOCR Engine, OpenCV, PyZBar
- **Backend**: FastAPI (Python 3.11), Pydantic v2, SQLite / PostgreSQL, FPDF2 Report Engine
- **Deployment**: Vercel (Frontend SPA & PWA), Render / Uvicorn (Backend REST API)

---

## 💻 Quick Start & Local Setup

### Prerequisites
- Node.js (v18+ recommended)
- Python (v3.10+ recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/bathulayashwanth6840-cmd/legal-metrology-dist.git
cd legal-metrology-dist
```

### 2. Install & Run Frontend
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 👥 Team LegalMetriX (SIH 2024)
- **Ministry**: Ministry of Consumer Affairs, Food & Public Distribution
- **Domain**: Legal Metrology Packaged Commodity Enforcement
