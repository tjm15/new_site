export type ArchitectureModuleId =
  | 'policy'
  | 'spatialAnalysis'
  | 'scenarioWorkspace'
  | 'assessmentSupport'
  | 'visualContext'
  | 'interfaceAudit'
  | 'integrationLayer'
  | 'agenticConductor'
  | 'deploymentScaler';

export interface ArchitectureModule {
  id: ArchitectureModuleId;
  title: string;
  description: string;
  modalContent?: string;
}

const POLICY_KNOWLEDGE_BASE_CONTENT = `
## Policy & Knowledge Base — Technical Architecture Overview

The Knowledge Base is a **policy-first semantic substrate**: a multilayered, AI-indexed store that fuses planning text, spatial context, embeddings, and probabilistic reasoning into a single retrieval surface optimised for **agentic policy interpretation**.

---

### Core Concepts

- **Document Parity Model**  
  Every plan, SPD, design code, or national policy is normalised into a unified schema.  
  No hierarchy is assumed — the LLM infers relevance and weight.

- **Semantic Atomisation**  
  Documents are decomposed into *policy atoms*: short, embedding-dense fragments carrying semantic, spatial, and cross-reference signals.

- **Vector-Native Policy Store**  
  All atoms are embedded via multimodal models (language + layout + spatial cues where available). Stored in \`pgvector\` with approximate nearest-neighbour indexing.

- **Inference-Driven Ontology**  
  There is **no fixed taxonomy**. Topic tags, policy themes, triggers, and material considerations are dynamically inferred by the LLM and stored as probabilistic metadata.

- **Cross-Document Graph Fabric**  
  Policies are woven into a lightweight graph of:
  - semantic links (cosine similarity),
  - citation links,
  - spatial relevance links,
  - and LLM-inferred “conceptual adjacency”.

---

### Ingestion & Processing

- **LLM-Orchestrated Parsing**  
  A backend pipeline uses large-context models to jointly:
  - segment text into conceptual units,
  - classify policy types,
  - extract constraints and decision tests,
  - infer geographical scope,
  - identify ambiguity/overlap regions.

- **Policy Embedding Cascade**  
  Hybrid embedding approach:
  - sentence-level,
  - policy-level,
  - whole-document embeddings  
  all stored to support multi-scale retrieval.

- **Graph-Aware Indexing**  
  Embeddings are enriched with features derived from:
  - cross-reference chains,
  - spatial bounding geometries,
  - planning-specific heuristics (tests, exceptions, qualifiers).

---

### Retrieval Layer (Agentic RAG)

- **Context-Sensitive Retrieval**  
  Queries (site geometry, development type, topic) construct a **retrieval frame**, selecting relevant atoms through spatial filters + hybrid semantic search.

- **Policy Reasoning Agent**  
  An agent interprets retrieved atoms using:
  - chain-of-thought distilled prompts,
  - plan-specific weighting,
  - conflict-and-overlap detection,
  - probabilistic applicability scoring.

- **Latent Policy Clustering**  
  Clustering identifies emergent policy families (e.g. “urban design cluster”, “town centre vitality cluster”), used for higher-order retrieval and summary.

- **Dynamic Relevance Narratives**  
  Agents output short rationales explaining why each policy surfaced, grounding them in retrieved atoms and spatial relevance signals.

---

### Frontend Integration

- **Live Policy Surface**  
  The UI displays a dynamically ranked gradient of policy relevance, updating with every change in site, scenario, or question.

- **Explainable Relevance Badges**  
  Small tokens show what the AI used: semantic match, spatial trigger, cross-reference, or inferred test.

- **On-Demand Deep Dive**  
  When expanded, each policy retrieves the underlying atoms, causal factors, and graph context, making the reasoning legible without overwhelming the user.

---

### What This Enables

- Policy selection based on **semantic reasoning**, not hard-coded rules.  
- Continuous updating as new documents are ingested.  
- A flexible, model-driven representation of planning policy that behaves more like an **adaptive knowledge graph** than a static database.  
- A foundation for agentic planning judgement: policies become **retrieval primitives**, not text blobs.
`;

export const ARCHITECTURE_MODULES: ArchitectureModule[] = [
  {
    id: 'policy',
    title: 'Policy & Knowledge Base',
    description: 'Stores and structures the content of plans, guidance, and strategies — showing which policies apply and why.',
    modalContent: POLICY_KNOWLEDGE_BASE_CONTENT,
  },
  {
    id: 'spatialAnalysis',
    title: 'Spatial Analysis Engine',
    description: 'Brings maps, datasets, and local evidence into the same view, revealing limits, capacities, and opportunities.',
    modalContent: `
## Spatial Analysis Engine — Technical Architecture Overview

The Spatial Analysis Engine is a **geospatial-compute substrate** that merges vector databases, multimodal embeddings, spatial statistics, and agentic reasoning into a single environment for **AI-driven spatial judgement**.

---

### Core Principles

- **Geometry as First-Class Input**  
  Sites, buffers, catchments, morphologies, networks — all treated as queryable geometric primitives.

- **Constraint Fields as Latent Surfaces**  
  Every spatial layer (flood, heritage, PTAL, land use, environmental limits) becomes a latent field the AI can query at any resolution.

- **Evidence as Feature Space**  
  Local evidence (delivery, land supply, employment, demographics) is encoded as spatialised features feeding into the reasoning agents.

---

### Data & Storage Layer

- **PostGIS as Spatial Kernel**  
  Geometries, rasters, multi-resolution tiling, spatial joins, Voronoi parcels, isochrones.

- **Vector-Augmented Geospatial Indexing**  
  Spatial layers receive **embedding signatures** (textual metadata + spatial semantics) stored in \`pgvector\`.  
  Enables “semantic spatial retrieval”: find layers conceptually relevant even before intersection.

- **Layer Registry**  
  Machine-readable catalogue storing layer lineage, quality, and update cadence.

---

### Processing & Computation

- **Intersection Compute Pipeline**  
  High-performance spatial ops:  
  - polygon-polygon intersections  
  - weighted buffers  
  - accessibility metrics  
  - transport-network distances  
  - zoning overlap scoring  
  - topological conflict detection  

- **Spatial Embedding Cascade**  
  Each site generates:
  - geometric embeddings (shape, compactness, orientation),
  - context embeddings (adjacencies, network access, typology),
  - constraint embeddings (latent signatures from intersected layers).

- **Spatial Reasoning Agent**  
  A dedicated agent synthesises:
  - constraint load,
  - opportunity zones,
  - morphological potential,
  - contradictory conditions,
  - inferred development envelopes  
  to produce **explainable spatial narratives**.

- **Autogenous Scenario Heuristics**  
  The engine can propose densities, envelopes, land-use mixes using heuristics blended with AI-derived opportunity surfaces.

---

### Retrieval & Interpretation

- **Hybrid Spatial-Semantic Retrieval**  
  A site query triggers both:  
  - raw PostGIS intersections, and  
  - semantic ranking of relevant layers via embeddings.

- **Latent Constraint Profiling**  
  Constraints form a multi-dimensional latent “spatial fingerprint”.  
  Similar fingerprints enable transfer learning across sites and LPAs.

- **Opportunity Field Generation**  
  Continuous surfaces representing accessibility, capacity, town-centre influence, environmental tolerance.

---

### Frontend Integration (React + MapLibre)

- **Real-Time Map Semanticisation**  
  The map is not just layers — each layer is treated as an “active evidence source” that contributes to the site’s spatial fingerprint.

- **Adaptive Diagnostics Panel**  
  Continuously recomputes:
  - constraint significance,
  - opportunity scores,
  - morphological risks,
  - spatially-grounded recommendations.

- **Explainable Geometry Chips**  
  The UI shows compact signals: *“heritage intensity”, “centre gravity”, “accessibility surface”, “viability risk flags”* derived from the spatial fingerprint.

---

### What This Enables

- Spatial reasoning that blends **hard geometry** with **soft semantics**.  
- AI that can “understand” sites beyond just intersections — **latent context awareness**.  
- Consistent, interpretable constraint/opportunity profiles across LPAs.  
- A foundation for **agentic spatial judgement**: geometry becomes a reasoning object, not just a polygon.
    `,
  },
  {
    id: 'scenarioWorkspace',
    title: 'Scenario Workspace',
    description: 'Lets planners model and compare options before decisions are made.',
    modalContent: `
## Scenario Workspace — Technical Architecture Overview

The Scenario Workspace is a **multi-model decision surface** that fuses policy signals, spatial fingerprints, optimisation heuristics, and agentic simulation into an environment for **composable planning futures**.

---

### Conceptual Foundations

- **Scenario as a State Vector**  
  Each scenario is a high-dimensional vector capturing:
  - land-use intentions  
  - density/height envelopes  
  - transport assumptions  
  - policy weightings  
  - opportunity/constraint signatures  
  - LLM-derived strategic goals  

- **Forward-Reasoning Kernel**  
  Scenarios drive predictive checks: conflicts, synergies, capacity deltas, alignment with strategic outcomes.

- **Comparative Semantics**  
  Scenarios are compared using embedded similarity, allowing planners to see how options diverge in **policy, spatial, and strategic space**.

---

### Data & Computation Layer

- **Scenario Graph Store**  
  Each scenario is a node with:
  - policy relevance embeddings  
  - spatial fingerprints  
  - outcome scores (AI-generated)  
  - lineage: which previous scenario it evolved from.

- **Constraint–Opportunity Fusion**  
  Stored from the Spatial Engine:
  - constraint load vectors  
  - opportunity fields  
  - accessibility/centre-gravity metrics  
  - morphology envelopes

- **Policy Applicability Matrix**  
  A scenario dynamically re-evaluates which policies strengthen, weaken, or contradict the intended direction.

---

### Reasoning Agents

- **Scenario Builder Agent**  
  Transforms natural language prompts (*“denser mixed-use core with stepped heights”*) into numeric scenario vectors.

- **Impact Simulation Agent**  
  Evaluates:
  - compatibility with local plan aims  
  - strategic goal alignment  
  - conflicts with policy atoms  
  - approximate capacity/viability hints  
  - cross-scenario trade-offs

- **Scenario Delta Interpreter**  
  Generates natural language explanations of:
  - what changed  
  - why scores shifted  
  - what tensions emerged  
  - how the option aligns with wider policy context.

---

### UI & Interaction Model

- **Composable Scenario Cards**  
  Each scenario behaves like an AI-generated object with:
  - headline metrics  
  - strength/weakness signatures  
  - “latent vibe” embeddings (policy–spatial balance)

- **Matrix Comparison View**  
  Multiple scenarios rendered on a grid:
  - conflict matrix  
  - opportunity matrix  
  - strategic alignment scores  
  - similarity heatmaps  

- **Explainer Threads**  
  Clicking any scenario opens a reasoning thread:
  - LLM-clarified assumptions  
  - constraint/opportunity narrative  
  - policy contradictions  
  - recommended next iterations

- **Iterative Generation Loop**  
  Users can issue prompts:
  - “Relax height in sub-area B”  
  - “Increase affordable housing weighting”  
  - “Prioritise transit-oriented infill”  
  Agents mutate the scenario vector and re-run all evaluations.

---

### What This Enables

- Rapid iteration on **policy-anchored**, **spatially-aware** future options.  
- AI-assisted comparison grounded in **real constraints**, **real policies**, and **latent signals**.  
- A shared surface for decision-makers where scenarios become **computable objects**, not static PDFs.  
- A stepping stone toward **agentic planning strategy** — modelling judgement, not just geometry.
    `,
  },
  {
    id: 'assessmentSupport',
    title: 'Assessment Support',
    description: 'Designed for everyday development management work — from small extensions to major infrastructure.',
    modalContent: `
## Assessment Support — Technical Architecture Overview

Assessment Support is an **agentic casework engine** for development management: it ingests sites, drawings, documents, policy atoms and constraints, then orchestrates a stack of reasoning agents to approximate **planner-grade assessment flow**.

---

### Core Idea

Every application is treated as a **live reasoning object**:

- A structured state vector:
  - site geometry + spatial fingerprint  
  - proposal metadata + typology  
  - policy applicability profile  
  - constraint–opportunity load  
  - precedent and guidance hits  
- Continuously re-evaluated as new information (revisions, consultee comments, conditions) arrives.

---

### Data & State Layer

- **Application Graph Store**
  - Nodes: application, revisions, consultees, reports, decisions.
  - Edges: policy links, spatial overlays, material consideration references, precedent citations.

- **Evidence Substrate**
  - Policy atoms (from the Knowledge Base)
  - Spatial fingerprints (from the Spatial Engine)
  - Uploaded documents (plans, DAS, statements) chunked + embedded
  - Precedent and appeal decision snippets

- **Case State Machine**
  - Lightweight status model: validation → assessment → negotiation → decision.
  - Each transition can trigger agent runs (reassessment, summary refresh, updated report sections).

---

### Reasoning Stack

- **Case Framing Agent**
  - Normalises the proposal into a canonical schema (use, scale, intensity, sensitivities).
  - Flags what *kind* of decision problem this is (e.g. householder edge-case, major scheme, strategic).

- **Material Considerations Agent**
  - Pulls relevant policy atoms, guidance, spatial constraints, and precedent.
  - Constructs a **material considerations graph**: issues, tests, and tensions.

- **Issue-by-Issue Assessment Agent**
  - Runs per topic (design, amenity, transport, heritage, climate, etc.).
  - For each:
    - states baseline policy tests,
    - evaluates proposal against tests,
    - surfaces conflicts, mitigations, and residual harms,
    - suggests conditions / heads of terms.

- **Negotiation & Delta Agent**
  - Given updated drawings or parameter tweaks, computes **assessment deltas**:
    - what improved,
    - what worsened,
    - which residual issues remain material.

- **Officer Report Agent**
  - Assembles structured officer-style narratives:
    - site and proposal description,
    - policy context,
    - topic-based assessment,
    - planning balance,
    - recommendation and potential conditions.
  - Driven by the case graph so it stays synchronised with evidence and state.

---

### Retrieval & RAG Pattern

- **Context-Aware Retrieval**
  - Jointly conditions on:
    - site geometry,
    - proposal type,
    - scale and sensitivity,
    - current case stage.
  - Pulls from:
    - policy KB,
    - spatial engine,
    - submission docs,
    - internal notes,
    - precedents.

- **Judgement Trace**
  - Each agent pass emits a compact trace:
    - input evidence bundle,
    - key tests applied,
    - provisional conclusion,
    - uncertainty/flagging signals.
  - These traces can be surfaced or compressed depending on UX mode.

---

### UI & Interaction Model

- **Case Dashboard Panel**
  - Single surface showing:
    - key facts,
    - live issue status (green/amber/red),
    - policy clusters in play,
    - constraint hot-spots.

- **Topic Lanes**
  - Each topic rendered as an **AI-backed lane**:
    - short conclusion,
    - key tests bullets,
    - links to supporting evidence.
  - Planner can edit, override, or pin their own wording.

- **Report View**
  - Officer report drafted in real time from the reasoning graph.
  - Edits feed back into the case state (the AI “learns” what the planner is accepting or discarding).

- **What-If Controls**
  - Quick prompts:
    - “Assume one extra storey”
    - “Reduce parking by 20%”
    - “Treat this as backland infill”  
  - Trigger re-assessment and updated narrative without re-entering everything.

---

### What This Enables

- **Planner-speed** assessment support for everything from small extensions to major schemes.  
- Casework where **policy, spatial evidence, and precedent** are always in view, not scattered.  
- An AI system that behaves like an **assistant planning officer**: structured, explainable, and responsive to negotiation — not just a static text generator.
    `,
  },
  {
    id: 'visualContext',
    title: 'Visual Context Layer',
    description: 'Interprets plans, diagrams, and visuals to recognise character, scale, and design intent.',
    modalContent: `
## Visual Context Layer — Technical Architecture Overview

The Visual Context Layer is a **multimodal vision–planning pipeline** that turns drawings, elevations, diagrams, streetscapes, and CGIs into **computable design signals**: massing, character cues, typology hints, spatial rules, and intent markers.

---

### Conceptual Model

- **Visual → Spatial → Policy Bridge**  
  Images aren’t treated as illustrations — they become structured inputs:
  - inferred geometry,
  - perceived height/scale,
  - frontage rhythm,
  - materiality cues,
  - plot structure and access points,
  - design-code semantics.

- **Design Codes as Semiotic Corpora**  
  Visuals are cross-referenced against design-code concepts (setbacks, active frontage, roof form, frontage proportion, grain, articulation).  
  The model learns to map each visual to **planning-relevant meaning**, not just pixels.

- **Latent Aesthetic Embeddings**  
  All visuals are turned into embeddings representing character, style, morphology, and pattern regularities — enabling similarity, clustering, and reasoning.

---

### Multimodal Processing Stack

- **Foundation VLM (Vision–Language Model)**  
  Takes raster/vector inputs and produces:
  - object detection (windows, doors, bays, roof types),
  - spatial relationships (height steps, massing blocks),
  - contextual cues (street hierarchy, corner plots),
  - semantic tags (historic, contemporary, suburban, high-street form).

- **Layout & Diagram Parser**
  - Interprets site plans, block plans, access diagrams.
  - Extracts:
    - parcel boundaries,
    - access routes,
    - building footprints,
    - key dimensions (approx. by scale inference),
    - landscape & public realm structure.

- **Massing Reconstruction Heuristics**
  - Approximate 2.5D/3D envelopes inferred from:
    - elevation proportions,
    - shadow cues,
    - fenestration density,
    - camera viewpoint,
    - surrounding context.

- **Design-Intent Interpreter**
  - LLM layer converts raw detections into:
    - design intentions,
    - architectural strategies (“stepped massing to respect context”),
    - potential conflicts (“overshadowing risk to neighbouring gardens”),
    - character alignment (“respects local rhythm of narrow frontages”).

---

### Evidence Integration

- **Cross-Modal RAG**
  - Visual embeddings join text and spatial embeddings.
  - Retrieval can surface:
    - similar approved schemes,
    - relevant policies on design, townscape, heritage,
    - precedent-based visual analogues.

- **Character-Conformance Scoring**
  - Computes how well a proposal matches:
    - local typology cluster,
    - design code rules,
    - street character embeddings,
    - neighbourhood grain.

- **Spatial Fingerprint Enrichment**
  - Visual-derived geometry enriches the Spatial Engine’s fingerprint:
    - building edges,
    - potential overshadowing vectors,
    - plot depth/width patterns,
    - frontage permeability.

---

### Reasoning Agents

- **Visual Assessment Agent**
  - Converts detections + embeddings into planner-relevant statements:
    - “Height appears 2–3 storeys above established ridge line.”
    - “Frontage articulation consistent with local terrace rhythm.”
    - “Likely overlooking from upper-level balconies.”

- **Heritage/Character Agent**
  - Computes:
    - alignment with conservation area character,
    - risks to setting,
    - authenticity vs pastiche indicators.

- **Design Code Compliance Agent**
  - Evaluates visuals against rules:
    - frontage proportion,
    - roofscape,
    - material palette,
    - massing hierarchy,
    - permeability and active edges.

---

### UI Integration

- **Visual Diagnostics Panel**
  - Shows annotated images:
    - detected elements,
    - height cues,
    - massing blocks,
    - design-intent notes.

- **Comparative Visual Search**
  - “Find similar schemes” using latent visual embeddings.
  - Helps justify decisions with precedent patterns.

- **Interactive Overlay**
  - Sketch or upload updated drawings → instant re-analysis.
  - Variants can be compared as visual deltas.

---

### What This Enables

- AI that **understands drawings the way planners do** — in terms of character, form, massing, and urban logic.  
- Design reviews backed by **vision-based evidence**, not just text.  
- Visual reasoning that complements spatial and policy reasoning, enabling richer, traceable assessment of design intent and contextual fit.
    `,
  },
  {
    id: 'interfaceAudit',
    title: 'Interface & Audit Layer',
    description: 'Presents everything through a transparent interface where every source and step of reasoning is recorded.',
    modalContent: `
## Interface & Audit Layer — Technical Architecture Overview

The Interface & Audit Layer is a **forensic reasoning surface**: every panel, score, and sentence is backed by a **machine-readable trail** designed for **judicial defensibility, inspector scrutiny, and institutional trust**.

---

### Core Role

- **Single, Event-Sourced Record of “What the System Did”**  
  UI, AI, and user actions are all logged in one canonical stream.
- **From Glanceable to Forensic**  
  Lightweight badges in the UI map directly to deep, inspectable judgement traces.
- **Litigation-Ready Transparency**  
  Decisions can be replayed as structured evidence bundles for JR, inquiries, or complaints.

---

### State, Provenance & Evidence

- **Event-Sourced Backbone**
  - Every change is an immutable event:
    - \`input.received\`, \`data.retrieved\`, \`llm.invoked\`, \`user.edited\`, \`snapshot.frozen\`.
  - “Current state” is just a projection; the full sequence is always recoverable.

- **Provenance Graph**
  - Nodes: datasets, policy atoms, spatial fingerprints, prompts, model outputs, human edits.
  - Edges: \`used_in\`, \`derived_from\`, \`overridden_by\`, \`superseded_by\`.
  - Enables questions like:
    - *“Exactly which policy extracts and constraints underpinned this paragraph?”*
    - *“What changed between Draft 2 and the final officer report?”*

- **Evidence-Bound Assertions**
  - Each AI assertion carries a **binding** to supporting evidence:
    - policy chunks,
    - spatial analysis outputs,
    - visual features,
    - prior precedents.
  - The UI exposes these bindings as **clickable evidence bundles**, the log stores them as structured references.

---

### Reasoning Trace & Judicial Defensibility

- **Judgement Trace Objects**
  - Each reasoning step is stored with:
    - inputs (data + context),
    - model and prompt IDs,
    - output reference,
    - uncertainty/flagging signals.
  - Think **“mini case note”** but machine-verifiable.

- **Snapshot & Diff**
  - Snapshots freeze:
    - scenarios,
    - assessment narratives,
    - applied policies,
    - associated traces.
  - Diffs show:
    - what evidence changed,
    - what reasoning changed,
    - where human overrides occurred.
  - This supports **audit trails compatible with JR-style review** (was the decision taken on a rational basis with relevant considerations?).

- **Human Override Semantics**
  - When officers edit or reject AI content:
    - the override is logged,
    - the original AI suggestion is preserved,
    - the final wording is clearly marked as **human-owned**.
  - Separates **tool support** from **decision-maker judgement**, which matters legally.

---

### UI Patterns for Trust

- **Provenance-Aware Components**
  - Every key component has:
    - subtle origin glyphs (*policy*, *spatial*, *precedent*, *AI synthesis*),
    - hover-to-view sources,
    - click-through to full trace.
  - No “mystery sentences”: anything material can be traced back.

- **Audit Ribbon**
  - A persistent bar with:
    - active snapshot ID,
    - trace count,
    - unresolved flags,
    - export controls.
  - One action → full **timeline** view (who did what, when, and based on what).

- **Explainability Modes**
  - \`Summary\`: minimal hints suitable for everyday casework.
  - \`Inspect\`: expanded rationales, structured issue-by-issue trace.
  - \`Forensic\`: full prompts, model metadata, diffs — intended for internal QA, complaints teams, inspectors, or legal review.

---

### Governance & Legal Hooks

- **Role-Scoped Audit Views**
  - Officers: concise trace + key evidence.
  - Managers / QA: more detailed reasoning paths and overrides.
  - Inspectors / Ombudsman / Courts: exportable forensic bundle with:
    - evidence graph,
    - trace log,
    - configuration hashes,
    - snapshot lineage.

- **Signed-Off Decisions**
  - Human sign-off is:
    - an explicit event,
    - linked to the snapshot & trace set they saw.
  - Supports a clear answer to:
    - *“What information was before the decision-maker?”*
    - *“Was anything relevant omitted or mischaracterised?”*

- **Exportable Audit Bundles**
  - One click generates a **JR/complaints-ready pack**:
    - key conclusions,
    - underlying evidence,
    - reasoning chain,
    - model + config metadata.
  - Designed to be usable for:
    - FOI/EIR responses,
    - Local Government & Social Care Ombudsman,
    - Planning Inspectorate,
    - judicial review disclosure.

---

### What This Enables

- A UI where **no conclusion is a black box** — everything is tied to evidence and a reasoning trail.
- Decision support that can withstand **legal challenge, inspector scrutiny, and public complaints**, because the reasoning is **replayable, attributable, and properly documented**.
- A planning AI that behaves like a careful officer keeping a file: structured notes, clear sources, and a defensible trail from input → reasoning → decision.
    `,
  },
  {
    id: 'integrationLayer',
    title: 'Integration Layer',
    description: 'Connects to BOPS, PlanX, and Open Digital Planning APIs — keeping plans, applications, and evidence in sync with live council systems.',
    modalContent: `
## Integration Layer — Technical Architecture Overview

The Integration Layer is the **connective tissue** between the Assistant and the wider digital planning ecosystem.  
It ensures that everything happening inside the system stays in sync with **BOPS**, **PlanX**, **Open Digital Planning (ODP)** services, and any LPA data stores.

---

### Core Purpose

- **Live Interoperability**
  - Pulls and pushes data through ODP-aligned schemas.
  - Syncs cases, documents, consultees, evidence, and plan data without manual re-entry.

- **Open Standards First**
  - Uses the ODP API specifications, GeoJSON/JSON:API patterns, and schema registries.
  - Compatible with Local Plan schemas, design code formats, and BOPS case structures.

- **Bidirectional Data Flow**
  - Ingests evidence, applications, constraints, and comments.
  - Exports assessments, scenario outputs, officer notes, and audit bundles.

---

### Technical Features

- **Schema Harmonisation**
  - Normalises external data into the Assistant’s internal state vectors.
  - Tracks versioning, effective dates, and document lineage.

- **Robust Connectors**
  - BOPS connector (casework, documents, decision outcomes).
  - PlanX connector (site data, constraints, user-led enquiries).
  - ODP connector (Local Plan data, design codes, spatial datasets).

- **Event-Aware Sync**
  - Updates propagate as events:
    - \`bops.case.updated\`
    - \`odp.plan_modified\`
    - \`planx.constraint_detected\`
  - Eliminates duplicated or stale records.

---

### What This Enables

- Seamless collaboration across digital planning platforms.  
- Zero “copy/paste admin” for officers.  
- A planning AI that is **embedded in the real operational stack**, not a standalone toy.
    `,
  },
  {
    id: 'agenticConductor',
    title: 'Agentic / LLM Conductor',
    description: 'Coordinates models, tools, and prompts behind the scenes — turning raw data, maps, and documents into coherent, planner-grade reasoning.',
    modalContent: `
## Agentic / LLM Conductor — Technical Architecture Overview

The Agentic / LLM Conductor is the **orchestration engine** that coordinates models, prompts, tools, and retrieval.  
It turns raw data into **coherent, multi-step planning reasoning** by running specialised agents in sequence or in parallel.

---

### Core Purpose

- **Model Coordination**
  - Routes tasks to OSS, frontier, or VLM models depending on context.
  - Manages embeddings, RAG queries, multimodal interpretation, and spatial reasoning calls.

- **Agentic Reasoning**
  - Each domain (policy, design, transport, heritage, spatial, DM assessment) has its own agent with:
    - tuned prompts,
    - tool access,
    - safety rules,
    - uncertainty reporting.

- **Tool-Enabled Intelligence**
  - Agents can call tools for:
    - spatial operations,
    - document parsing,
    - graph queries,
    - cross-reference resolution,
    - scenario scoring.

---

### Technical Features

- **Prompt Library & Versioning**
  - Every prompt has an ID, version, and diff history.
  - Tied directly into the audit trail.

- **Multi-Agent Pipelines**
  - Chains agents to produce structured outputs:
    - scenario → constraints → policy → reasoning → report.

- **Adaptive Retrieval**
  - Retrieval frames condition on:
    - geometry,
    - proposal type,
    - topic focus,
    - prior traces,
    - policy clusters.

- **Predictable Degradation**
  - If a model/tool is unavailable:
    - agents fall back to safe heuristics,
    - outputs are clearly marked as fallback mode.

---

### What This Enables

- High-quality, planner-legible reasoning without brittle workflows.  
- Modular, extensible intelligence — new agents can be added without redesigning the system.  
- A stable execution layer that behaves like a **conductor for a planning-AI orchestra**.
    `,
  },
  {
    id: 'deploymentScaler',
    title: 'Deployment Scaler',
    description: 'Packages the whole stack for secure, scalable deployment — from local demos to GPU-backed council environments that stay fast and reliable under real workloads.',
    modalContent: `
## Deployment Scaler — Technical Architecture Overview

The Deployment Scaler packages the entire system for **secure, resilient, scalable deployment** — from personal demo mode to full council-grade infrastructure.

---

### Core Purpose

- **Elastic, GPU-Optimised Runtime**
  - Supports OSS models, multimodal interpreters, and hybrid inference.
  - Scales under load for spikes in case volume or batch parsing.

- **Environment-Agnostic Architecture**
  - Deployable to:
    - council cloud environments,
    - on-prem clusters,
    - container-based GPU nodes,
    - local workstation demos.

- **Operational Safety**
  - Ensures consistent behaviour across staging, testing, and production.

---

### Technical Features

- **Containerised Stack**
  - FastAPI backend, PostGIS/pgvector, vector workers, ingestion agents, and audit server.
  - Each component shipped as reproducible containers with pinned versions.

- **Auto-Scaling Profiles**
  - Horizontal scaling for:
    - scenario generation,
    - batch policy parsing,
    - visual analysis.
  - Vertical GPU scaling for:
    - large embeddings,
    - VLM interpretation,
    - agent chains.

- **CI/CD Pipeline**
  - Automated:
    - build,
    - test,
    - static analysis,
    - prompt diffing,
    - deployment.
  - Ensures deterministic releases with audit-ready version notes.

- **Observability & Telemetry**
  - Metrics, logs, trace counts, override rates, model latency.
  - Helps councils verify that the system is stable and behaving safely.

---

### What This Enables

- A planning AI that can run in **real operational environments** without fragility.  
- Councils can adopt it confidently because it’s **scalable, monitorable, and version-controlled**.  
- A smooth path from local demo → pilot → production with **no architectural rewrites**.
    `,
  },
];
