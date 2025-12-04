---
title: 🌀 Dashboard Diffusion: A Report-Writing and Decision-Support Assistant
date: 2025-09-25
summary: Exploring fluid explainability for discretionary decisions and officer-ready reports.
---

## Positioning the Intervention

City dashboards have been the subject of extensive debate across planning theory, human–computer interaction, urban informatics, AI ethics, and critical data studies. While critiques often focus on their tendency to simplify and flatten complexity into fixed indicators, the real challenge is broader: how to design socio-technical systems that surface complexity without overwhelming users, remain auditable and legitimate, and still perform effectively as software. **Dashboard Diffusion** positions itself at this intersection. It is not merely a dashboard but a **report-writing and decision-support assistant**—a living experiment in combining theoretical insight with practical engineering design.

## The Alternative: Fluid, Conversational Explainability

Rather than presenting governance decisions as closed or fully resolved, Dashboard Diffusion foregrounds the *process* of reasoning as a dynamic, interactive phenomenon. Drawing inspiration from diffusion-based generative AI models, the interface unfolds through iterative refinement: beginning with skeletal placeholders, developing tentative interpretations, and gradually stabilising into a provisional but usable form. Crucially, this unfolding is not hidden from the user. Each stage of iteration is surfaced through micro-narratives and visible reconfigurations of the interface itself. The assistant does not claim to offer certainty; instead, it enacts and performs its reasoning process as a communicative gesture.

## How It Works

* **Single-threaded loop**: a large language model generates JSON-patch edits in rapid succession, creating the effect of an interface that ‘thinks out loud.’
* **Stochastic but bounded**: each run is seeded to allow for variation, ensuring the interface feels alive and responsive while remaining anchored to contextual constraints (e.g. planning policy, site data, precedents).
* **Conversational explainability**: interface components can be interrogated with questions such as *“why is this here?”* and the system will provide concise, context-aware rationales. User interventions (such as dismissing a tile) become part of an ongoing dialogue with the assistant.
* **Tactile interaction**: rather than static presentation, the assistant’s dashboard canvas invites direct manipulation. Components can be moved, resized, or temporarily dismissed, with the system dynamically recalibrating its explanations in response.

## Why It Matters

* **Interdisciplinary resonance**: the assistant draws from planning scholarship, HCI, AI ethics, complexity theory, governance studies, and engineering practice to prototype a new form of socio-technical reasoning surface.
* **Resisting flattening**: by making uncertainty and revision visible, it resists the over-simplification often associated with digital infrastructures and acknowledges the provisional and negotiated character of evidence.
* **Embodied discretion**: it mirrors how planning officers and decision-makers actually reason in practice—through partial judgments, provisional accommodations, and iterative adjustments—thereby fostering institutional legitimacy.
* **Engineering legitimacy**: beyond theory, it demonstrates how to implement runtimes, schemas, and interaction loops that allow stochastic, provisional behaviour while remaining resilient, performant, and auditable.
* **Explainability as performance**: legitimacy is produced not only through static audit trails but also through the *experience* of seeing reasoning unfold, correct itself, and become legible in real time.

## Research Contribution

This experiment pushes across multiple fields simultaneously. For HCI, it reconceives explainability not as retrospective justification but as *ongoing performative interaction*. For planning theory, it provides a new way to surface material considerations and discretionary judgments. For urban informatics, it demonstrates how dashboards can become dynamic stages for the negotiation of evidence. For critical data studies, it shows how infrastructures can thicken, rather than flatten, epistemic space. For AI research, it offers a design pattern for single-threaded, conversationally explainable systems. And for software engineering, it frames Dashboard Diffusion as a design problem: how to build interactive systems that reconcile stochastic behaviour with user trust, performance, and auditability.

In doing so, **Dashboard Diffusion** transforms the dashboard into a **report-writing and decision-support assistant**: a medium of epistemic thickening where uncertainty, contestation, and reasoning remain materially present and open to engagement. This reframing situates dashboards not as end-points of analysis but as active sites of negotiation, aligning digital infrastructures more closely with the discretionary and contested realities of democratic governance.

---

**In short:** Dashboard Diffusion is both a technical prototype and a conceptual intervention. It demonstrates how a dashboard can move beyond static reduction to become a **fluid assistant for reports, decisions, material considerations, and the performance of reasoning itself.**
