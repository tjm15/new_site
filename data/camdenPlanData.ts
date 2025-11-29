
export const PLAN_CONTEXT = {
  title: "Camden Local Plan",
  authority: "London Borough of Camden",
  status: "Proposed Submission Draft (2025)",
  summary: "The Camden Local Plan sets out the Council's vision for future development over the next 15 years (2026-2041). It focuses on delivering 11,550 new homes, creating a sustainable and inclusive economy, and responding to the climate emergency. Key growth areas include Euston, Holborn, and Kentish Town. The plan prioritises affordable housing, active travel, and high-quality design.",
  keyIssues: [
    "Housing Affordability & Supply",
    "Climate Emergency & Net Zero",
    "Inclusive Economy & Good Work",
    "Town Centre Vitality",
    "Sustainable Transport & Air Quality"
  ]
};

export const TOPICS = [
  { id: "housing", label: "Housing", color: "#e91e63" },
  { id: "economy", label: "Economy & Jobs", color: "#ff9800" },
  { id: "environment", label: "Climate & Environment", color: "#4caf50" },
  { id: "transport", label: "Transport", color: "#2196f3" },
  { id: "design", label: "Design & Heritage", color: "#9c27b0" },
  { id: "community", label: "Community", color: "#00bcd4" }
];

export const POLICIES = [
  {
    reference: "DS1",
    title: "Delivering Healthy and Sustainable Development",
    section: "Development Strategy",
    topics: ["housing", "environment", "health"],
    summary: "Ensures all development contributes to 'Good Growth', promoting inclusion, reducing inequality, and achieving net zero carbon. Requires highest design quality and efficient land use.",
    text: "The Council will expect development to support the creation of healthy and sustainable places by ensuring new buildings are of the highest design quality, achieving net zero carbon emissions, meeting needs for new homes and jobs, and prioritising active travel. Development must optimise the use of land and be inclusive and accessible."
  },
  {
    reference: "H1",
    title: "Maximising Housing Supply",
    section: "Housing",
    topics: ["housing"],
    summary: "Aims to deliver at least 11,550 additional homes from 2026/27 to 2040/41. Prioritises permanent self-contained housing and resists loss of existing homes.",
    text: "The Council will aim to deliver at least 11,550 additional homes. It regards permanent self-contained housing as the priority land-use. It will resist development of short-term lets and maximise housing delivery on underused sites using a design-led approach."
  },
  {
    reference: "H4",
    title: "Maximising the Supply of Affordable Housing",
    section: "Housing",
    topics: ["housing", "equality"],
    summary: "Supports the strategic target of 50% affordable housing. Seeks a tenure split of 60% low-cost rented and 40% intermediate.",
    text: "The Council supports the strategic target for 50% of new homes to be genuinely affordable. We will seek a borough-wide target of 3,000 additional affordable homes. Contributions are expected from all major developments. The guideline mix is 60% low-cost rented and 40% intermediate housing."
  },
  {
    reference: "IE1",
    title: "Growing a Successful and Inclusive Economy",
    section: "Economy",
    topics: ["economy"],
    summary: "Supports business growth, particularly in the Knowledge Quarter and CAZ. Protects viable employment space and seeks affordable workspace.",
    text: "To secure a strong, diverse, sustainable economy, the Council will use planning powers to support businesses of all sizes, prioritise key growth sectors and research activities, and resist the loss of viable employment space. We will require affordable workspace in larger schemes."
  },
  {
    reference: "IE3",
    title: "Industry",
    section: "Economy",
    topics: ["economy"],
    summary: "Protects industrial and warehousing land. Supports intensification of industrial sites like Regis Road and Murphy's Yard.",
    text: "The Council will manage and protect the supply of industrial and warehousing land. We will resist the loss of industrial land unless demonstrated it is no longer suitable. Site allocations identify opportunities to intensify large industrial sites to deliver jobs and housing."
  },
  {
    reference: "CC1",
    title: "Responding to the Climate Emergency",
    section: "Climate",
    topics: ["environment"],
    summary: "Prioritises retention of existing buildings. Requires new buildings to be net zero carbon in operation and resilient to climate change.",
    text: "Development must prioritise measures to mitigate and adapt to climate change. This includes prioritising the retention of existing buildings over demolition (retrofit first), minimising whole life carbon, and ensuring new buildings are net zero carbon in operation."
  },
  {
    reference: "T1",
    title: "Safe, Healthy and Sustainable Transport",
    section: "Transport",
    topics: ["transport"],
    summary: "Prioritises walking, wheeling, and cycling. Requires car-free development and Healthy Streets approach.",
    text: "The Council will prioritise the delivery of safe, active, healthy, affordable and sustainable transport. We will prioritise walking, wheeling and cycling, and expect development to implement the Mayor's Healthy Streets approach. We will reduce vehicle use through car-free development."
  },
  {
    reference: "D2",
    title: "Tall Buildings",
    section: "Design",
    topics: ["design"],
    summary: "Defines tall buildings (40m+ in CAZ, 30m+ elsewhere) and identifies specific locations where they may be appropriate.",
    text: "Tall buildings are defined as over 40m in the Central Activities Zone and over 30m elsewhere. Locations where tall buildings may be appropriate are identified on the Policies Map (e.g., Euston, King's Cross, O2 Centre). Proposals must be of exemplary design and sustainable quality."
  },
  {
    reference: "S1",
    title: "South Camden Strategy",
    section: "Place",
    topics: ["economy", "housing", "transport"],
    summary: "Focuses growth on Euston, King's Cross and Holborn. Supports the Knowledge Quarter and major station improvements.",
    text: "Development in South Camden should contribute to the area's London-wide role. Major development is focused at Euston (1,500-2,500 homes) and King's Cross/Camley Street (1,380 homes). Supports the Knowledge Quarter as a hub of innovation."
  },
  {
    reference: "C1",
    title: "Central Camden Strategy",
    section: "Place",
    topics: ["housing", "economy"],
    summary: "Major regeneration at Regis Road and Murphy's Yard in Kentish Town to create mixed-use neighbourhoods.",
    text: "Development in Central Camden will focus on Kentish Town and Camden Town. Regis Road and Murphy sites are expected to deliver approx 1,750 new homes and intensified industrial space. Camden Goods Yard will deliver approx 1,200 homes."
  }
];

// Sample new-system plan seed (optional demo)
export const CAMDEN_SAMPLE_PLAN = {
  id: 'camden_new_plan',
  title: 'Camden Local Plan (New System Demo)',
  area: 'London Borough of Camden',
  systemType: 'new',
  stages: [
    { id: 'PREP', title: 'Preparation / Notice to Commence' },
    { id: 'GATEWAY_1', title: 'Gateway 1: Readiness' },
    { id: 'BASELINING', title: 'Baselining & Evidence' },
    { id: 'VISION_OUTCOMES', title: 'Vision & Outcomes' },
    { id: 'SITE_SELECTION', title: 'Site Selection & Spatial Strategy' },
    { id: 'CONSULTATION_1', title: 'Consultation 1 (Scope & Early Vision)' },
    { id: 'GATEWAY_2', title: 'Gateway 2: Submission Ready' },
    { id: 'CONSULTATION_2', title: 'Consultation 2 (Proposed Plan)' },
    { id: 'GATEWAY_3', title: 'Gateway 3: Examination Readiness' },
    { id: 'SUBMISSION_EXAM', title: 'Submission & Examination Rehearsal' },
    { id: 'ADOPTION_MONITORING', title: 'Adoption & Monitoring' }
  ],
  timetable: { milestones: [] },
  visionStatements: [
    { id: 'v1', text: 'Deliver inclusive growth with net zero development.', metric: 'Annual emissions trajectory' }
  ],
  sites: [
    { id: 'site_regis_road', name: 'Regis Road', location: 'Kentish Town' },
    { id: 'site_murphys_yard', name: "Murphy's Yard", location: 'Kentish Town' }
  ],
  currentStage: 'PREP'
} as const
