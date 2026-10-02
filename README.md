# POLAR COMMAND ❄️
### Antarctic Operational Digital Twin & Mission Control Platform
**Smart India Hackathon Problem Statement — SIH26060**

> A deterministic, cross-domain Operational Digital Twin framework for the remote monitoring, predictive decision support, and logistics optimization of India's Antarctic research stations: **Maitri** ($70^\circ46'\text{S}, 11^\circ44'\text{E}$) and **Bharati** ($69^\circ24'\text{S}, 76^\circ11'\text{E}$).

---

## 🎯 Purpose & Non-Negotiable MVP Goal

Operating in Antarctica poses severe physical isolation, extreme katabatic winds ($>100\text{ km/h}$), temperatures below $-40^\circ\text{C}$, and tight resupply windows constrained by polar pack ice. Isolated monitoring dashboards fail because a disruption in one subsystem propagates rapidly across other domains.

**POLAR COMMAND** integrates the four SIH26060 domains into **ONE connected operational state engine**:

$$\text{ENVIRONMENT} \longleftrightarrow \text{ENERGY} \longleftrightarrow \text{INFRASTRUCTURE} \longleftrightarrow \text{LOGISTICS}$$

### The Core Operational Workflow:
$$\mathbf{OBSERVE} \longrightarrow \mathbf{UNDERSTAND} \longrightarrow \mathbf{PREDICT} \longrightarrow \mathbf{SIMULATE} \longrightarrow \mathbf{ACT}$$

### The Canonical Causal Chain:
$$\text{Extreme Cold Snap (-12°C)} \xrightarrow{} \text{HVAC Thermal Draw} \uparrow \xrightarrow{} \text{Microgrid Demand} \uparrow \xrightarrow{} \text{Genset Load} \uparrow \xrightarrow{} \text{Fuel Burn Rate} \uparrow \xrightarrow{} \text{Fuel Runway} \downarrow \xrightarrow{} \text{Logistics Risk} \uparrow \xrightarrow{} \text{Recommended Operator Action}$$

---

## 🖥️ Command Center V3 Layout & Information Hierarchy

The Command Center is engineered to answer an operator's critical questions within **5–10 seconds**:
1. **Which station am I monitoring?** (Maitri vs. Bharati switchable live nodes)
2. **What is its current health?** (Explainable 0–100 index with domain weights & driver attribution)
3. **Is anything wrong?** (Operational status: `NOMINAL`, `WATCH`, `WARNING`, `CRITICAL`)
4. **Why is it happening?** (Physical sensor telemetry root causes)
5. **Which systems are affected?** (Connected topological dependencies)
6. **What will happen next?** ($T+0\text{H}$ to $T+96\text{H}$ predictive horizon)
7. **What should the operator do?** (Actionable Standard Operating Procedures)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  POLAR COMMAND [SIH26060] | STATIONS: [MAITRI 91%] [BHARATI 80%] | STANCE: [POWER CONSERVATION ▾]     │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  STATION HEALTH: 80%   │  OPERATIONAL STATUS: ELEVATED RISK  │  NET POWER: -190 kW  │  AUTONOMY:       │
│  Why? Logistics drop   │  0 Critical, 1 Warning              │  DEFICIT (BESS -32kW)│  CONSTRAINED     │
├────────────────────────┴─────────────────────────────────────┴──────────────────────┴──────────────────┤
│                                      ABOVE THE FOLD HERO                                               │
├─────────────────────────────────────────────────────────┬──────────────────────────────────────────────┤
│                     LEFT 65%:                           │                   RIGHT 35%:                 │
│         OPERATIONAL SPATIAL DIGITAL TWIN                │            CROSS-DOMAIN RISK ENGINE          │
│                                                         │                                              │
│   • Generator #1 & #2 (East Power House)                │   • SEVERITY: CRITICAL / WARNING             │
│   • High-Voltage Microgrid Bus Backbone                 │   • EVENT: Incident Headline                 │
│   • BESS Battery Storage Bank (450 kWh)                 │   • WHY: Root Physical Sensor Cause          │
│   • Central HVAC Thermal Loop & Core Habitation         │   • AFFECTED: System Cascade Breadcrumbs     │
│   • Water RO Desalination & Melt Tank System            │   • EXPECTED IMPACT: Real Consequences       │
│   • Cryogenic Bulk Fuel Farm (9,400 L)                  │   • OPERATOR ACTION: Actionable SOP          │
│   • SATCOM Radome Ku/Ka Tracking Array                  │                                              │
│                                                         │   [ EXPLAIN RISK ]      [ SIMULATE IMPACT ]  │
│   [Conduit Highlight: Gen #2 → Grid → BESS → Fuel]      │                                              │
├─────────────────────────────────────────────────────────┴──────────────────────────────────────────────┤
│  LIVE CAUSAL FLOW: Temp (-12°C) → HVAC (195kW) → Demand (451kW) → Fuel Burn (2652L/d) → Risk (CRITICAL)│
├───────────────────────────────────┬────────────────────────────────────┬───────────────────────────────┤
│    NEXT 24 HOURS TIMELINE         │     LOGISTICS INTELLIGENCE         │   MISSION EVENT TIMELINE      │
│    NOW • +6H • +12H • +24H        │     Fuel Runway vs. 14d Safety     │   Observe → Analyze → Act     │
└───────────────────────────────────┴────────────────────────────────────┴───────────────────────────────┘
```

---

## ⚡ Core Functional Features

### 1. Connected Spatial Digital Twin
- Interactive 2D schematic blueprint with orthographic scale.
- Displays all 7 core subsystems: **Generators**, **Microgrid**, **BESS Battery**, **HVAC**, **Water Desalination**, **Bulk Fuel**, and **SATCOM**.
- Selecting any asset dynamically illuminates its connected operational cascade:
  $$\text{Generator \#2} \longrightarrow \text{Microgrid Deficit (-190kW)} \longrightarrow \text{BESS Battery Discharge} \longrightarrow \text{HVAC Priority} \longrightarrow \text{Fuel Runway} \longrightarrow \text{Station Risk}$$

### 2. Operational Status Consistency
- Never displays misleading *"Station Stable"* or *"Nominal Operations Across All Systems"* when unresolved warnings, reduced health, or logistics constraints exist.
- Shows live domain state:
  - Energy: `NOMINAL` / `WARNING` / `CRITICAL`
  - Water: `NOMINAL` / `WATCH` / `WARNING`
  - Life Support: `NOMINAL` / `WATCH` / `CRITICAL`
  - Communications: `NOMINAL` / `WATCH` / `CRITICAL`
  - Logistics: `NOMINAL` / `WARNING` / `CRITICAL`

### 3. Cross-Domain Intelligence (Power vs. Autonomy)
- Prevents operators from misinterpreting isolated telemetry numbers.
- Example: Correlating a positive short-term power balance with constrained long-term autonomy:
  - **Current Power**: `NOMINAL (+69 kW)`
  - **Long-Term Autonomy**: `CONSTRAINED`
  - **Reason**: *Fuel stock ($4.3\text{d}$) is below the mandatory 14-day polar winter safety buffer. A shortage is projected before the resupply vessel's scheduled arrival.*

### 4. Explainable Station Health (`WHY 80%?`)
- Large $48\text{px}$ KPI with explicit multi-domain weightings:
  - Environment: 20%
  - Microgrid Energy: 30%
  - Infrastructure: 25%
  - Logistics: 25%
- Dynamic delta and driver attribution:
  - **PRIMARY DRIVER**: *Fuel runway contraction below operational reserve*
  - **SECONDARY DRIVER**: *Pack-ice resupply delay (+12 days)*

### 5. What-If Timeline Simulator & Recovery Testing
- Tests single and compounded failure scenarios:
  - Generator #2 Emergency Lockout
  - Extreme Antarctic Cold Snap ($-12^\circ\text{C}$ to $-30^\circ\text{C}$ offset)
  - Katabatic Blizzard ($>85\text{ km/h}$)
  - Prydz Bay Pack-Ice Resupply Delay ($+12$ to $+25\text{ days}$)
  - Full Cascading Emergency
- Projections calculated across timeline horizons: **`T+0H` $\rightarrow$ `T+6H` $\rightarrow$ `T+12H` $\rightarrow$ `T+24H` $\rightarrow$ `T+48H` $\rightarrow$ `T+72H` $\rightarrow$ `T+96H`**.
- **One-Click Recovery Action**: Operators can execute `[RUN RECOVERY SIMULATION]` to verify generator restoration, power stabilization, battery recovery, and risk reduction.

### 6. Functional Station Modes (Operational Stances)
Modes actively alter the deterministic physical simulation:
- **`NORMAL`**: Standard polar watchkeeping routine.
- **`SCIENCE OPERATIONS`**: Full experiment array powered ($+20\text{ kW}$).
- **`WEATHER ALERT`**: High-wind stow protocol for satellite dish; outdoor sorties restricted.
- **`POWER CONSERVATION`**: Automatically sheds non-critical load ($-45\text{ kW}$), throttles fuel burn by $16\%$, and protects BESS battery reserves.
- **`EMERGENCY`**: Maximum alert posture; cold-reserve gensets prioritized.

### 7. Verifiable Data Provenance (Data Honesty)
Zero fabricated AI confidence percentages. All telemetry badges clearly declare their source:
- `Public Observation`: ECMWF ERA5 & IMD Synoptic Models
- `Synthetic Telemetry`: Station edge instrumentation
- `Derived Calculation`: Microgrid electrical & thermodynamic formulas
- `Prototype Forecast`: Deterministic simulation engine

### 8. Edge / Offline Synchronization
- Full operational resilience during satellite blackouts (`CONNECTED`, `INTERMITTENT`, `DISCONNECTED`).
- In offline mode, an Edge Queue buffers all actions locally (`ALERT_ACK`, `REQUISITION_CREATE`, `CONFIG_CHANGE`).
- When connectivity restores, the queue automatically flushes and synchronizes with NCPOR cloud.

---

## 🧪 Acceptance Test Demo Walkthrough

| Step | Action | Expected Physical Result | System Response |
| :---: | :--- | :--- | :--- |
| **1** | **Baseline Start** | Bharati starts nominal. Health $93\%$, Net Power $+69\text{ kW}$, 0 critical alerts. | Status: `NOMINAL` |
| **2** | **Trip Generator #2** | Genset #2 switches to `OFFLINE`. Generation drops to $261\text{ kW}$. Net balance drops to **`-190 kW POWER DEFICIT`**. Battery begins discharging. | Status flips to `CRITICAL`. Microgrid cascade highlights. |
| **3** | **Cold Snap** | Ambient temp drops $-12^\circ\text{C}$. HVAC heating draw surges to $195\text{ kW}$. Fuel burn accelerates. Power deficit widens. | Health index drops. Thermal overdrive alert triggers. |
| **4** | **Resupply Delay** | Pack-ice delay (+12d) applied. Resupply ETA shifts to 30 days. Fuel runway ($18.2\text{d}$) contracts inside the arrival window. | Logistics status flips to `CRITICAL`. Shortage date calculated. |
| **5** | **Explain Risk** | Operator clicks `[EXPLAIN RISK]`. | Drawer opens showing the 5-step causal sequence with provenance tags. |
| **6** | **Simulate Impact** | Operator clicks `[SIMULATE IMPACT]`. | Simulator projects battery depletion at $T+24\text{H}$ and fuel exhaustion at $T+72\text{H}$. |
| **7** | **Recovery Simulation** | Operator clicks `[EXECUTE RECOVERY ACTION]`. | Generator restored, power reserve positive, battery stabilizes, and risk clears. |
| **8** | **Reset Nominal** | Operator clicks `Reset Baseline`. | Composable scenario events reset cleanly to baseline across all 4 domains. |

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router, Server Components & Client Hydration) |
| **Language** | TypeScript 5.7 (Strict Type Checking) |
| **Styling** | Vanilla CSS + Tailwind CSS (Antarctic Mission Control Palette) |
| **Typography** | `Inter` / `IBM Plex Sans` (UI) & `IBM Plex Mono` (Telemetry) |
| **Icons & Graphics** | Lucide React + Vector SVG Spatial Blueprints |
| **Data Visualization** | Recharts (Time-series telemetry & load duration curves) |
| **Testing** | Vitest (Deterministic calculation test suites) |

---

## 🎨 Colour & Design Palette

| Role | Color Name | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **Background** | Polar Navy | `#08243A` | Base mission control environment |
| **Surface** | Deep Ocean Navy | `#0C2D48` | Operational card background |
| **Border** | Polar Slate | `#1D4B75` / `#CBD5E1` | Modular engineering borders |
| **Primary Accent** | Ice Cyan | `#00B8E6` | Telemetry values and vector links |
| **Secondary Accent**| Research Blue | `#1976D2` | Navigation and informational status |
| **Nominal** | Operational Green | `#10B981` | Safe operational equilibrium |
| **Warning** | Warning Amber | `#F59E0B` | Threshold violations and advisories |
| **Critical** | Critical Red | `#E53935` | Mechanical trips, deficits, and emergencies |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or 20.x
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/Rahulcoder-881/polar-command.git
cd polar-command

# Install dependencies
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (redirects to the Command Center at `/dashboard`).

### Running Unit Tests
```bash
npm test
```
Executes all 10 Vitest calculation and deterministic coupling test suites:
- Energy demand thermodynamic formulas
- Specific fuel consumption and runway calculations
- Predictive logistics stockout comparisons
- Offline edge buffer queuing and flushing
- Multi-domain health score weighting
- Dynamic risk state transitions

### Production Build
```bash
npm run build
npm run start
```

---

## 📁 Repository Structure

```
polar-command/
├── app/
│   ├── dashboard/          # Primary Command Center V3
│   ├── digital-twin/       # Full 2D Spatial Twin Explorer
│   ├── simulator/          # What-If Timeline-Based Stress Simulator
│   ├── energy/             # Microgrid, Generation & Battery Telemetry
│   ├── environment/        # Weather, Katabatic Wind & Blizzard Risk
│   ├── infrastructure/     # Asset Health, Maintenance & Degraded Nodes
│   ├── logistics/          # Fuel Farm, Inventory Runways & Requisitions
│   ├── alerts/             # Active Threshold Alerts & SOP Remediation
│   ├── reports/            # Operational SITREP & PDF Export
│   └── api/                # Edge Telemetry, State & Simulation Routes
├── components/
│   ├── layout/             # Low-footprint Navbar & Offline Sync Banner
│   ├── twin/               # StationTwin2D schematic blueprint with connected paths
│   └── common/             # ProvenanceBadge and UI widgets
├── context/
│   └── StationContext.tsx  # Central Digital Twin State Provider & Edge Queue
├── lib/
│   ├── calculations.ts     # Deterministic evaluation pipeline & simulation formulas
│   └── permissions.ts      # Action-layer RBAC enforcement
├── mocks/
│   └── stationData.ts      # Maitri and Bharati baseline data
├── tests/
│   └── calculations.test.ts # Vitest verification test suites
└── types/
    └── index.ts            # Strict TypeScript domain interfaces
```

---

## 📄 License & Attribution
Developed for **Smart India Hackathon (SIH26060)**.
Reference station data based on public records from the National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences, Government of India.
All synthetic telemetry and simulations are clearly tagged with verifiable provenance.
