export type Company = {
  symbol: string;
  name: string;
  sector: string;
  color: string;
};
export const companies: Company[] = [
  { symbol: "INFY", name: "Infosys", sector: "IT services", color: "#435ba5" },
  {
    symbol: "TCS",
    name: "Tata Consultancy Services",
    sector: "IT services",
    color: "#7b477f",
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    sector: "Diversified",
    color: "#7c6840",
  },
  {
    symbol: "HDFCBANK",
    name: "HDFC Bank",
    sector: "Banking",
    color: "#3b577a",
  },
  {
    symbol: "ICICIBANK",
    name: "ICICI Bank",
    sector: "Banking",
    color: "#a46637",
  },
  { symbol: "ITC", name: "ITC", sector: "Consumer goods", color: "#447a69" },
  {
    symbol: "LT",
    name: "Larsen & Toubro",
    sector: "Industrials",
    color: "#687c39",
  },
  {
    symbol: "SUNPHARMA",
    name: "Sun Pharmaceutical",
    sector: "Healthcare",
    color: "#a56761",
  },
  {
    symbol: "TATASTEEL",
    name: "Tata Steel",
    sector: "Materials",
    color: "#617a86",
  },
  {
    symbol: "BHARTIARTL",
    name: "Bharti Airtel",
    sector: "Telecom",
    color: "#ad4b4b",
  },
  {
    symbol: "MARUTI",
    name: "Maruti Suzuki",
    sector: "Automobiles",
    color: "#58648a",
  },
  {
    symbol: "TITAN",
    name: "Titan Company",
    sector: "Consumer discretionary",
    color: "#578887",
  },
  {
    symbol: "ASIANPAINT",
    name: "Asian Paints",
    sector: "Consumer goods",
    color: "#8a5d86",
  },
  {
    symbol: "HAL",
    name: "Hindustan Aeronautics",
    sector: "Defence",
    color: "#5b7055",
  },
  {
    symbol: "PERSISTENT",
    name: "Persistent Systems",
    sector: "IT services",
    color: "#b37740",
  },
  {
    symbol: "DIXON",
    name: "Dixon Technologies",
    sector: "Electronics",
    color: "#7a6b9d",
  },
  { symbol: "TRENT", name: "Trent", sector: "Retail", color: "#9b5963" },
  {
    symbol: "CDSL",
    name: "Central Depository Services",
    sector: "Financial services",
    color: "#58799b",
  },
];
export type Evidence = {
  id: string;
  symbol: string;
  title: string;
  kind: string;
  url: string;
  date: string;
  locator: string;
  facts: string;
};
const infyBase =
  "https://www.infosys.com/investors/reports-filings/quarterly-results/";
export const evidence: Evidence[] = [
  {
    id: "SAMSUNG-2Q26",
    symbol: "005930.KS",
    title: "Samsung Electronics 2Q 2026 earnings-call presentation",
    kind: "Results filing",
    date: "2026-07-30",
    url: "https://images.samsung.com/is/content/samsung/assets/global/ir/docs/2026_2Q_conference_eng.pdf",
    locator:
      "Pages 2, 5–6 (PDF numbering): disclaimer, consolidated results and business segments",
    facts:
      "The presentation reports consolidated second-quarter 2026 results under K-IFRS, before the external review is completed. It separates Device Solutions (semiconductors), Device eXperience (mobile, TV and home appliances), Samsung Display and Harman. The business-segment discussion describes strong AI-server memory demand while noting component-cost pressure in Device eXperience. Segment performance should be evaluated separately; this presentation alone does not establish a valuation or stock recommendation.",
  },

  {
    id: "INFY-AR25",
    symbol: "INFY",
    title: "Infosys integrated annual report FY2025",
    kind: "Annual report",
    url: "https://www.infosys.com/investors/reports-filings/annual-report/annual-reports/ar-2024-25.html",
    date: "2025-06-02",
    locator: "FY2025 business highlights",
    facts:
      "Infosys delivers digital services and consulting. FY2025 constant-currency revenue grew 4.2%; return on equity was 29.0%. These historical figures describe FY2025, not the latest quarter.",
  },
  {
    id: "INFY-CALL25",
    symbol: "INFY",
    title: "Infosys Q4 FY2025 management conference",
    kind: "Management transcript",
    url: infyBase + "2024-2025/q4/documents/transcripts/press-conference.pdf",
    date: "2025-04-17",
    locator: "Page 3, management opening remarks",
    facts:
      "Management guided FY2026 constant-currency revenue growth of 0% to 3% and operating margin of 20% to 22%. Guidance applies to the full financial year, not each quarter.",
  },
  {
    id: "INFY-RESULT26",
    symbol: "INFY",
    title: "Infosys Q4 and FY2026 results",
    kind: "Results filing",
    url: infyBase + "2025-2026/q4/documents/ifrs-usd-press-release.pdf",
    date: "2026-04-23",
    locator: "Page 1, full-year highlights",
    facts:
      "FY2026 constant-currency revenue grew 3.1%. Reported IFRS operating margin was 20.3%; adjusted margin was 21.0%. FY2026 free cash flow was $3,733 million. FY2027 revenue-growth guidance is 1.5% to 3.5% in constant currency.",
  },
  {
    id: "INFY-FACT26",
    symbol: "INFY",
    title: "Infosys Q4 FY2026 financial fact sheet",
    kind: "Financial statements",
    url: infyBase + "2025-2026/q4/documents/fact-sheet.pdf",
    date: "2026-04-23",
    locator: "Page 3, consolidated IFRS income statement",
    facts:
      "Q4 FY2026, in USD million: revenue 5,040; operating profit 1,055; PBT 1,168; net profit after non-controlling interests 919. Previous quarter: 5,099; 937; 1,035; 747. Prior-year quarter: 4,730; 992; 1,117; 813. Operating profit is EBIT, not EBITDA.",
  },
  {
    id: "TCS-AR25",
    symbol: "TCS",
    title: "TCS integrated annual report FY2025",
    kind: "Annual report",
    url: "https://www.tcs.com/content/dam/tcs/investor-relations/financial-statements/2024-25/ar/annual-report-2024-2025.pdf",
    date: "2025-06-01",
    locator: "Letter from the CEO, FY2025 performance",
    facts:
      "TCS provides IT services, consulting and business solutions. FY2025 revenue was ₹255,324 crore, up 6.0% in rupees and 4.2% in constant currency. Operating margin was 24.3%, and net margin 19.0%.",
  },
  {
    id: "TCS-CALL25",
    symbol: "TCS",
    title: "TCS Q4 FY2025 earnings-call transcript",
    kind: "Earnings-call transcript",
    url: "https://www.tcs.com/content/dam/tcs/investor-relations/financial-statements/2024-25/q4/Management%20Commentary/Transcript%20of%20the%20Q4%202024-25%20Earnings%20Conference%20Call%20held%20at%201900%20hrs%20IST%20on%20Apr%2010,%202025.pdf",
    date: "2025-04-10",
    locator: "Page 3, CFO commentary",
    facts:
      "FY2025 operating margin declined 30 basis points to 24.3%. Management described wage and infrastructure investment headwinds, partly offset by utilisation, productivity and currency. Q4 operating margin was 24.2%.",
  },
  {
    id: "TCS-RESULT25",
    symbol: "TCS",
    title: "TCS Q4 FY2025 company results",
    kind: "Results announcement",
    url: "https://www.tcs.com/who-we-are/newsroom/press-release/tcs-financial-results-q4-fy-2025",
    date: "2025-04-10",
    locator: "Quarterly highlights",
    facts:
      "TCS announced Q4 revenue of $7.47 billion, a $12.2 billion quarterly order book and a proposed final dividend of ₹30 per share. Order bookings are not recognised revenue.",
  },
  {
    id: "RIL-AR25",
    symbol: "RELIANCE",
    title: "Reliance integrated annual report FY2025",
    kind: "Annual report",
    url: "https://www.ril.com/ar2024-25/financial-performance-and-review.html",
    date: "2025-08-06",
    locator: "Management discussion: financial performance and review",
    facts:
      "FY2025 consolidated EBITDA was ₹183,422 crore, up 2.9%. Digital-services EBITDA grew 14.7%. Consumer businesses contributed over half of consolidated EBITDA. Capital expenditure was ₹131,107 crore. Standalone PAT declined 16.1%; standalone and consolidated measures are different.",
  },
  {
    id: "ITC-AR25",
    symbol: "ITC",
    title: "ITC report and accounts FY2025",
    kind: "Annual report",
    url: "https://itcportal.com/about-itc/shareholder-value/annual-reports/itc-annual-report-2025/pdf/ITC-Report-and-Accounts-2025.pdf",
    date: "2025-07-03",
    locator: "Report and accounts, FY2025 continuing operations",
    facts:
      "ITC has consumer-goods, paperboards, packaging and agribusiness operations. Analyse continuing operations separately from the demerged hotels business; exceptional gains can distort comparisons of total profit.",
  },
  {
    id: "ITC-RESULT25",
    symbol: "ITC",
    title: "ITC FY2025 company results",
    kind: "Results announcement",
    url: "https://itcportal.com/media-centre/press-releases/Media-Statement-Financial-Results-for-the-Quarter-ended-31st-March-2025.html",
    date: "2025-05-22",
    locator: "Overall company performance",
    facts:
      "FY2025 continuing operations: gross revenue ₹73,464.55 crore; EBITDA ₹24,024.83 crore; profit before exceptional items and tax ₹26,000.86 crore. Total PAT included an exceptional gain related to discontinued operations; compare like-for-like profit.",
  },
];
export type Filing = {
  id: string;
  symbol: string;
  category: string;
  priority: "High" | "Medium" | "Routine";
  title: string;
  summary: string;
  why: string;
  date: string;
  source: string;
};
export const filings: Filing[] = [
  {
    id: "f1",
    symbol: "INFY",
    category: "Results",
    priority: "High",
    title: "Growth cleared the original guidance ceiling. What about margins?",
    summary:
      "FY2026 revenue grew 3.1% in constant currency; reported operating margin was 20.3%.",
    why: "Compare full-year delivery with the original 0–3% growth and 20–22% margin guidance. Keep reported and adjusted margins separate.",
    date: "2026-04-23",
    source: "INFY-RESULT26",
  },
  {
    id: "f2",
    symbol: "INFY",
    category: "Guidance",
    priority: "High",
    title: "A new year, a fresh range to track",
    summary:
      "Management set FY2027 constant-currency revenue-growth guidance at 1.5–3.5%.",
    why: "A forward expectation to track against future annual delivery; it is not a prediction of share-price performance.",
    date: "2026-04-23",
    source: "INFY-RESULT26",
  },
  {
    id: "f3",
    symbol: "TCS",
    category: "Results",
    priority: "High",
    title: "A strong order book alongside margin pressure",
    summary:
      "Q4 FY2025 bookings reached $12.2bn; quarterly operating margin was 24.2%.",
    why: "Bookings show contracted business, but conversion into revenue and the cost of delivery still need watching.",
    date: "2025-04-10",
    source: "TCS-RESULT25",
  },
  {
    id: "f4",
    symbol: "ITC",
    category: "Results",
    priority: "High",
    title: "Headline profit needs a second look",
    summary:
      "FY2025 total profit included an exceptional gain connected with discontinued operations.",
    why: "Separate continuing operations before comparing underlying earnings. A one-time gain is not recurring operating growth.",
    date: "2025-05-22",
    source: "ITC-RESULT25",
  },
  {
    id: "f5",
    symbol: "RELIANCE",
    category: "Annual report",
    priority: "Medium",
    title: "Consumer businesses now contribute over half of EBITDA",
    summary:
      "FY2025 consolidated EBITDA rose 2.9%; digital-services EBITDA grew 14.7%.",
    why: "Segment contributions matter: the group headline can mask different trends across businesses.",
    date: "2025-08-06",
    source: "RIL-AR25",
  },
  {
    id: "f6",
    symbol: "TCS",
    category: "Dividend",
    priority: "Routine",
    title: "Final dividend proposed: ₹30 per share",
    summary:
      "A historical FY2025 board recommendation, subject to shareholder approval at the time.",
    why: "A capital-return update, lower priority than earnings quality and operating performance.",
    date: "2025-04-10",
    source: "TCS-RESULT25",
  },
];
export const researchProfiles: Record<
  string,
  {
    overview: string;
    metrics: { label: string; value: string; note: string; source: string }[];
    bull: string;
    bear: string;
    question: string;
    sourceIds: string[];
  }
> = {
  INFY: {
    overview:
      "A global digital-services and consulting business. This saved review combines the FY2025 annual report and management transcript with FY2026 reported delivery.",
    metrics: [
      {
        label: "FY26 CC growth",
        value: "3.1%",
        note: "Full-year · constant currency",
        source: "INFY-RESULT26",
      },
      {
        label: "FY26 op. margin",
        value: "20.3%",
        note: "Reported IFRS · adjusted 21.0%",
        source: "INFY-RESULT26",
      },
      {
        label: "FY26 free cash flow",
        value: "$3.73bn",
        note: "Company-defined FCF",
        source: "INFY-RESULT26",
      },
    ],
    bull: "Revenue growth finished above the original FY2026 upper bound, and reported operating margin stayed within the original range.",
    bear: "The reported margin was close to the lower end of the range. Adjusted margin excludes items and should not replace the reported figure.",
    question:
      "What will support FY2027 growth, and how much of margin delivery depends on adjustments?",
    sourceIds: ["INFY-AR25", "INFY-CALL25", "INFY-RESULT26", "INFY-FACT26"],
  },
  TCS: {
    overview:
      "An IT-services, consulting and business-solutions company. This saved review covers FY2025 and is not a current-quarter assessment.",
    metrics: [
      {
        label: "FY25 revenue",
        value: "₹255,324cr",
        note: "Consolidated · rupee terms",
        source: "TCS-AR25",
      },
      {
        label: "FY25 op. margin",
        value: "24.3%",
        note: "Down 30 bps year on year",
        source: "TCS-CALL25",
      },
      {
        label: "FY25 CC growth",
        value: "4.2%",
        note: "Full-year · constant currency",
        source: "TCS-AR25",
      },
    ],
    bull: "Positive constant-currency growth and management’s account of productivity measures support the operating story.",
    bear: "Margins declined despite offsets. A large order book does not by itself establish the pace of revenue conversion.",
    question:
      "How quickly will booked contracts become revenue, and can productivity offset wage and investment costs?",
    sourceIds: ["TCS-AR25", "TCS-CALL25"],
  },
  RELIANCE: {
    overview:
      "A diversified group spanning consumer and industrial businesses. This saved review uses the FY2025 annual report’s management discussion.",
    metrics: [
      {
        label: "FY25 EBITDA",
        value: "₹183,422cr",
        note: "Consolidated · up 2.9%",
        source: "RIL-AR25",
      },
      {
        label: "Digital EBITDA growth",
        value: "14.7%",
        note: "FY25 · segment measure",
        source: "RIL-AR25",
      },
      {
        label: "FY25 capex",
        value: "₹131,107cr",
        note: "Group capital expenditure",
        source: "RIL-AR25",
      },
    ],
    bull: "Consumer businesses contributed more than half of consolidated EBITDA, with digital services growing faster than the group.",
    bear: "Group growth and standalone profit moved differently. Large capital spending calls for careful monitoring of cash returns.",
    question:
      "Which segments will generate cash returns on the capital invested?",
    sourceIds: ["RIL-AR25"],
  },
  ITC: {
    overview:
      "A business with consumer-goods, paperboards, packaging and agribusiness interests. The FY2025 hotels demerger makes continuing versus discontinued operations important.",
    metrics: [
      {
        label: "Reporting period",
        value: "FY2025",
        note: "Historical annual-report review",
        source: "ITC-AR25",
      },
      {
        label: "Key comparison",
        value: "Like-for-like",
        note: "Separate discontinued operations",
        source: "ITC-AR25",
      },
      {
        label: "Focus",
        value: "Cash quality",
        note: "Check recurring earnings",
        source: "ITC-AR25",
      },
    ],
    bull: "The annual report provides the primary evidence needed to assess the continuing businesses separately.",
    bear: "Headline profit can mix ongoing performance with exceptional or discontinued-operation effects.",
    question:
      "How did continuing operations perform after separating the hotels business and one-time items?",
    sourceIds: ["ITC-AR25"],
  },
};
export const defaultTheses = [
  {
    id: "t1",
    symbol: "INFY",
    text: "Revenue growth should stay within management’s stated range, with reported margins remaining resilient.",
    tags: ["growth", "margin", "guidance"],
  },
  {
    id: "t2",
    symbol: "RELIANCE",
    text: "Consumer businesses should contribute more to earnings while capital spending produces cash returns.",
    tags: ["consumer", "capital", "cash"],
  },
];
export const categories = ["Results", "Guidance", "Annual report", "Dividend"];
