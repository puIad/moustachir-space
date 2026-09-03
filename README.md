# DEMO SCRIPT — Moustachir BI & Performance Platform

This document outlines a **5 to 8-minute jury presentation script** designed to showcase the Moustachir BI & Performance Platform. It tells a cohesive story: from fragmented data to real-time strategic intelligence, interactive operations, and professional reporting.

---

## Slide & Narrative Progression (5-8 Minutes)

### 1. Introduction: The Fragmented Reality (1 Minute)
*   **Action**: Show the landing page of the application (e.g., in French: `Tableau de Bord`, or in English: `Dashboard`).
*   **Narrative**: 
    > "Welcome, members of the jury. Before this platform, Moustachir's operational data was scattered across 5 distinct branches (Consulting, Comptabilité France, Communication, Academy, Management), locked in separate CSV files, Excel spreadsheets, and unstructured forms. 
    >
    > Calculating basic KPIs like global revenue, churn risks, or team utilization required weeks of manual data gathering, leading to lagging decisions and compliance risks under Loi 18-07 regarding PII exposure. Today, we present a unified, offline-first solution built using React 18, TypeScript, Dexie (IndexedDB), and custom scikit-learn ML pipelines."

---

### 2. Centralization & Data Integrity (1 Minute)
*   **Action**: Hover over the **Data Status Indicator** (e.g. `DB · 6,339 rows · seed v1.0.0`) in the bottom-right corner. Show the **Language Toggle** in the TopBar and click it to toggle between **Français (FR)** and **English (EN)**.
*   **Narrative**:
    > "On first launch, the platform securely ingests and merges the 12 core warehouse tables into a browser-based IndexedDB. It runs completely offline without sending sensitive data to external servers. 
    >
    > The interface is fully bilingual, adapting instantly to French or English, and employs a high-density, professional design utilizing display typography (Space Grotesk) and mono-spaced fonts for numbers to facilitate visual auditing."

---

### 3. Executive Analytics & Scoping (1.5 Minutes)
*   **Action**: Walk through the Group-1 sidebar navigation:
    1.  **Dashboard** (Tableau de Bord): Point out the **PROJECTION / CONJECTURE** badges next to estimated metrics and **REAL / RÉEL** badges on leads and client growth.
    2.  **Financial** (Finance): Show Revenue (10,729,000 DA), gross volume, and MRR (16,000 DA).
    3.  **Marketing**: Highlight campaign ROAS, qualified leads, and cost-per-lead (CPL) trends.
    4.  **Operational** (Opérations): Point out project success rate (100%) and consultant utilization (65.4%).
*   **Action**: Use the **Global Filter Bar** at the top. Change the branch filter from **All** to **Academy** or **Consulting**.
*   **Narrative**:
    > "The platform separates real acquisition counts (like our 1,451 clients and leads) from simulated financial projections, making every estimation transparent with explicit 'Projection' badges. 
    >
    > Notice how our headline figures reconcile perfectly to the real anchors (like 10.7M DA recognized revenue and 16k DA subscription MRR). Changing the global filters immediately propagates to all screens, filtering our datasets, trends, and service-adoption matrices in real time."

---

### 4. Drilling into Branch Data (1.5 Minutes)
*   **Action**: Click on **Consulting** (Conseil) under the **Branches** nav section. In the secondary sidebar, click **Clients** (or **Academy** -> **Étudiants**). Show the DataTable features:
    *   Type a name in the global search bar (e.g., `Alger`).
    *   Click on the **Revenue** column header to sort desc/asc.
    *   Click on a row to highlight it and open the **Detail Drawer** (Entity Detail) on the right.
    *   Toggle to the **Historique** tab in the drawer to show audit trails.
    *   Toggle to the **Parcours** (Lifeline) tab to show the client's historical timeline (Lead → Meeting → Proposal → Project → Feedback).
*   **Narrative**:
    > "Under Group-2, each branch enjoys its own specialized Workspace. For instance, in the Consulting branch, the system translates entity names to the local taxonomy.
    >
    > Our high-density DataTable allows text search, column hiding, custom multi-sort, and CSV export. Clicking a row brings up the detailed dossier, showing the full transaction history, before-and-after audit logs, and a complete lifecycle timeline tracking every interaction this client has had with us."

---

### 5. Closing the Loop: Interactive CRUD Lifecycle (1 Minute)
*   **Action**: Add a new lead and watch KPIs recalculate.
    1.  Click **Consulting** branch workspace.
    2.  Click **Créer Prospect / Add Prospect** button in the branch action bar.
    3.  Fill in the form: Name: `Nouveau Client Jury`, Email: `jury@moustachir.com`, Phone: `0550123456`, Branch: `Consulting`, Service Line: `Consulting Strategy`, Expected Budget: `500000`, Assigned Salesperson: Pick anyone (e.g. `Amine`). Click **Enregistrer / Save**.
    4.  Go to the **Detail Drawer** for the new lead, click the context action button **Convertir en Opportunité / Convert to Opportunity**.
    5.  In the opportunity drawer, click **Enregistrer Vente / Record Sale**. Select the service line, tier (Strategy Pro), check the base amount (e.g. `350,000 DA` loaded from pricing lookup), and click **Save**.
    6.  In the sale drawer, click **Associer Paiement / Record Payment**. Save the payment of `350,000 DA`.
    7.  Click **Dashboard** (Tableau de Bord) in the sidebar. Note that the total client count has increased to `1,452` and the recognized revenue has jumped to `11,079,000 DA` (10,729,000 + 350,000).
*   **Narrative**:
    > "Let's perform a live transaction. We register a new prospect manually. The pricing engine automatically suggests standard rates. 
    >
    > We convert this lead, record a won sale, and log a payment of 350,000 DA. Instantly, our IndexedDB database persists this change, and when we return to our Dashboard, the revenue has recalculated from 10.72M DA to 11.07M DA, showing immediate data flow from operations to analytics."

---

### 6. Machine Learning Data Quality & System Alerts (1 Minute)
*   **Action**: Click on **DataManager** (Gestionnaire de Données) under the **System** section in the sidebar.
    *   Show the **ML Ingestion Pipeline** tab (explaining the SimpleImputer, KMeans client tiering, and Logistic Regression churn models).
    *   Show the **Strategic Alerts** tab, pointing out live calculated warnings (e.g. Churn risk alerts, capacity surcharges).
*   **Narrative**:
    > "To maintain clean data, the platform embeds a Data Manager displaying the results of our scikit-learn ML pipeline. It visualizes normalizations, missing data imputations, and deduplication actions. 
    >
    > It also runs client-tiering and churn risk algorithms, which are surfaced in the 'Strategic Alerts' tab. This lists immediate business warnings: consultants with critical workloads, clients showing high churn probabilities, and upsell recommendations."

---

### 7. Shareholder Deck Export & Conclusion (0.5 Minute)
*   **Action**: Go back to the **Dashboard** (Tableau de Bord) and click the **Générer le deck / Generate Deck** button in the top-right header action slot. Wait a second for the `.pptx` file to download.
*   **Narrative**:
    > "Finally, reporting is automated. With a single click, the platform extracts our live figures, aggregates our Chart.js visualizations, compiles them into a PowerPoint presentation conforming to Moustachir's corporate style, and initiates a browser download.
    >
    > Fragmented sheets are replaced by a single source of truth, secure, offline, and ready to drive strategic decision-making. Thank you, and I am open to your questions."

---

## 🛠️ Verification Checklist for Presenter

Prior to the jury presentation, perform these quick steps to ensure a flawless run:
1.  **Browser Setup**: Ensure you are running Chrome or Edge in full screen.
2.  **Database Reset**: Click the floating `Reset` button in the bottom-right corner to restore the database to its clean seeded state (reconciled to the 10,729,000 DA baseline).
3.  **Download Test**: Click the *Generate Deck* button once to confirm PowerPoint downloads occur instantly.
