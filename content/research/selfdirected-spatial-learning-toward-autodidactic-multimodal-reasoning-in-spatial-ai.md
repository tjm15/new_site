---
title: Self-Directed Spatial Learning: Toward Autodidactic Multimodal Reasoning in Spatial AI
date: 2025-11-12
summary: Early notes on teaching spatial models to reason across maps, text, and policy without constant supervision.
---

### Abstract

This paper introduces a framework for **self‑directed multimodal learning** in spatial artificial intelligence: a paradigm in which vision–language models acquire three‑dimensional reasoning from two‑dimensional representations through internally generated critique rather than external supervision. The approach replaces dataset‑driven supervision with *reasoning as feedback*, allowing models to refine spatial understanding by interrogating their own hypotheses without any paired 3D labels. The implications extend to urban analytics, architectural cognition, and the broader pursuit of explainable spatial intelligence.

### 1. Introduction

Architectural drawings contain latent spatial knowledge. Plans, sections, and elevations encode volumetric, typological, and contextual information through abstract two‑dimensional means. Human designers intuitively reconstruct depth, proportion, and enclosure from these abstractions, forming a mental model of space from line and shade. Conventional AI systems, by contrast, rely on large paired datasets to perform similar reconstructions. The central question of this paper is whether a model can cultivate comparable perceptual capacity through **autodidactic multimodal reasoning**, learning through a sustained dialogue between perceptual and linguistic faculties rather than through labelled supervision.

### 2. Background

While existing research in self‑supervision and critique‑driven learning demonstrates that models can improve via internal feedback, most implementations still depend on explicit labels, structured losses, or ground‑truth geometry. Contemporary 2D‑to‑3D generative systems succeed in reconstructing geometry but remain data‑intensive. The present framework seeks to extend these ideas by establishing a **cross‑modal Socratic loop**: an unsupervised conversation between vision and language modalities oriented toward the comprehension of spatial form. This loop becomes a self‑contained mechanism of reasoning, validation, and adaptation.

### 3. Novelty and Contribution

No existing method, to our knowledge, learns three‑dimensional spatial structure directly from two‑dimensional architectural drawings using a language‑based critic as the primary training signal. This approach operates without paired 3D supervision and targets massing‑level understanding appropriate to architectural and urban reasoning. The framework introduces an architecture in which a perception model proposes volumetric hypotheses from 2D input, while a reasoning model evaluates those hypotheses linguistically, transforming explanation into supervision. It formalises a language‑based reward process that combines textual critique with soft geometric plausibility measures such as depth coherence, lighting correspondence, and plan–elevation alignment. It also defines a unified text–image–geometry embedding space that allows hypotheses and critiques to be stored, searched, and assessed over time. The novelty arises from the integration of these components into a single autodidactic learning cycle capable of evolving without ground‑truth geometry.

### 4. Methodology

The architecture consists of two mutually dependent agents: a **Student**, serving as the perception model, and a **Critic**, acting as the reasoning model. The Student ingests two‑dimensional material—plans, elevations, or renders—and proposes a three‑dimensional hypothesis expressed as depth maps, voxel fields, or textual descriptions of spatial form. The Critic examines the Student’s proposal, evaluating its geometric plausibility, contextual coherence, and visual consistency. It produces both a written critique and a scalar reward signal reflecting its confidence in the explanation. Training proceeds as a recursive conversation: the Student generates a hypothesis; the Critic analyses it and provides feedback; the Student adjusts its internal representation and generates a refined output. Counterfactual inputs, such as mirrored or relit elevations, introduce perturbations that enforce geometric and contextual robustness. Through successive rounds of exchange, the Critic gradually achieves meta‑consistency across varied cases, stabilising its internal judgement. Within this loop, reasoning itself becomes the data from which the model learns.

### 5. Implementation

Implementation can leverage existing multimodal encoders and decoders—CLIP‑ or SigLIP‑derived transformers and diffusion–transformer hybrids—augmented by lightweight reward modelling. A shared embedding space aligns textual, visual, and geometric tokens, enabling the Critic to cross‑reference linguistic reasoning with spatial evidence. The reward combines linguistic plausibility assessments with auxiliary geometric constraints such as silhouette alignment, shadow logic, and topological continuity. Training begins with simple orthographic shapes and progresses to complex architectural compositions, incorporating multi‑view pairs where available but avoiding explicit meshes. All hypotheses and critiques are logged within a unified index for interpretability, ablation, and retrieval, ensuring the learning process remains transparent and analysable.

### 6. Evaluation without Paired Labels

Evaluation must proceed without ground‑truth geometry. Internal performance can be measured through cross‑view geometric consistency, depth ordering accuracy, and silhouette overlap between generated and synthetic projections. The stability and reliability of the Critic can be tested through ensemble agreement and correlation between reward values and independent human judgements. Qualitative assessment involves expert reviewers comparing paired outputs and explanations to determine perceptual plausibility. Retrieval tasks further test semantic alignment: a query such as “three‑storey terrace with continuous parapet” should retrieve spatially and semantically coherent results. Ablation studies, removing or perturbing the Critic, provide empirical evidence of the system’s dependence on reasoning feedback.

### 7. Limitations and Risks

Several limitations accompany this paradigm. The Student may exploit weaknesses in the Critic’s evaluation to achieve high rewards without genuine spatial understanding, a phenomenon analogous to reward hacking. Counterfactual training and auxiliary geometric checks can reduce this risk. The model may also hallucinate geometrically plausible yet inaccurate massings, necessitating uncertainty estimates and visual explanations that expose the basis of each decision. Domain bias remains a concern, as training corpora may over‑represent specific drawing conventions or regional typologies. Computational cost and potential instability of reinforcement‑like loops demand cautious scheduling and, where possible, the use of ensemble critics to maintain equilibrium. Finally, linguistic confidence must not be mistaken for factual accuracy: every critique should be accompanied by a justification trace referencing the specific visual features that informed it.

### 8. Discussion

Self‑directed spatial learning reframes machine perception as a form of epistemic inquiry. Instead of memorising correspondences between input and output, the model learns through the interrogation of its own perceptual assumptions. The process mirrors the dialectical reasoning used by human designers, who test, refute, and refine spatial ideas through dialogue and critique. In this sense, the proposed architecture introduces a new mode of explainability: the system does not merely justify its answers post‑hoc but learns through the act of explanation itself. This dual movement of perception and reflection supports transparency, interpretability, and accountability in the learning of spatial intelligence.

### 9. Implications and Future Work

The implications of this research extend across several domains. In urban modelling, self‑directed spatial learning could generate volumetric priors from existing plan archives and visual datasets, enriching the representation of the built environment. In architectural analysis, it offers a mechanism for evaluating typological coherence, rhythm, and proportional harmony directly from drawings. In the field of explainable AI, it provides a generalisable model of language‑grounded critique as a training signal for visual reasoning systems. Future work will focus on the implementation of small‑scale prototypes, the development of evaluation protocols without paired supervision, and the exploration of cross‑cultural and morphological generalisation. Further studies will investigate multi‑critic governance, where multiple reasoning agents negotiate consensus judgements of spatial plausibility, thereby enhancing robustness and interpretive depth.

### 10. Conclusion

Self‑directed spatial learning represents a paradigm shift in spatial AI. By allowing models to learn spatial reasoning not from static labels but from dynamic dialogue, it unites perception and critique into a single cognitive system. The result is an emerging form of machine literacy—a capacity to imagine, test, and justify the geometry of space through reflection rather than imitation. This work gestures toward a future in which artificial intelligence develops not only the ability to read and represent the built environment but also to reason about its own understanding of it.

*(Draft working paper, Winter 2025)*
