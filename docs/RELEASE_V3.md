# Market desk and company discovery

The company flow is no longer restricted to the 18-company portfolio. Search by name or ticker, choose the exchange, then inspect price history, calculated trading observations and available company disclosures. Coverage depends on provider and exchange; this is not a guarantee of every worldwide company’s financial reports. Private/unmatched companies are not assigned invented NSE listings or price data.

Indian companies use discovered primary PDFs, transcripts and dated BSE/NSE disclosure links. U.S. companies attempt official SEC report discovery; automated SEC access returned 403 during local verification and can fall back to official report-directory links and user-provided extracts. Other supported price exchanges can show charts even where automatic document ingestion is unavailable. A small verified Samsung source set supplements the same general flow. AI business analysis uses supplied/discovered evidence and requires Google sign-in. Price observations load without making an AI call.

Visual changes: navy sidebar and market stage, real-price SVG chart, featured-company selectors, mint accents, a dated price ribbon with pause control, opening/page transitions, responsive chart coordinate sizing and reduced-motion support. No invented live quotes, portfolio returns, trading execution or predictions were added.

Validation: 23 tests, TypeScript, local API checks and production build. Browser screenshot/interaction validation is blocked by an unavailable browser host; native Chrome also timed out. No new visual QA claim.
