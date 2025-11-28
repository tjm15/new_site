export const PLAN_CONTEXT = {
  title: "Manchester Local Plan & Places for Everyone",
  authority: "Manchester City Council / GMCA",
  status: "Core Strategy Adopted (2012) / PfE Adopted (2024)",
  summary: "The development plan for Manchester comprises the Core Strategy (2012-2027) and the Places for Everyone Joint DPD (2024). It sets a vision for Manchester as a world-class city, driving the regional economy through the City Centre and Airport. Key themes include high-density growth in the Core Growth Area, regenerating Inner Areas, achieving a carbon-neutral city by 2038, and ensuring inclusive growth across neighbourhoods.",
  keyIssues: [
    "Economic Growth (City Centre, Airport City, Oxford Road Corridor)",
    "Zero Carbon & Climate Resilience (2038 Target)",
    "Housing Delivery (60,000+ new homes)",
    "Transport Connectivity (HS2, NPR, Metrolink)",
    "Inclusive Neighbourhoods & Health Inequalities"
  ]
};

export const TOPICS = [
  { id: "economy", label: "Economy & Growth", color: "#2196f3" },
  { id: "housing", label: "Housing & Living", color: "#e91e63" },
  { id: "environment", label: "Environment & Zero Carbon", color: "#4caf50" },
  { id: "transport", label: "Transport & Connectivity", color: "#ff9800" },
  { id: "place", label: "Place & Design", color: "#9c27b0" }
];

export const POLICIES = [
  {
    reference: "SP1 / JP-Strat1",
    title: "Spatial Principles & Core Growth Area",
    section: "Strategy",
    topics: ["economy", "housing"],
    summary: "Focuses high-density growth in the City Centre and Inner Areas. Defines the Core Growth Area as the primary economic driver.",
    text: "The Regional Centre will be the focus for economic and commercial development, retail, leisure, and cultural activity, alongside high-quality city living. The Core Growth Area (City Centre, Ethiad, Trafford Park, Port Salford) will see significant growth in jobs and housing to boost international competitiveness."
  },
  {
    reference: "EC11 / JP-Strat10",
    title: "Manchester Airport Strategic Location",
    section: "Economy",
    topics: ["economy", "transport"],
    summary: "Supports the growth of Manchester Airport and Airport City as a major sub-regional economic hub and international gateway.",
    text: "The growth of Manchester Airport to 2030 will be supported... including the expansion of the developed Airport area. The area is suitable for high-technology industries, logistics, offices, and hotels. Maximises benefits of exceptional connections including HS2/NPR."
  },
  {
    reference: "H1 / JP-H1",
    title: "Overall Housing Provision",
    section: "Housing",
    topics: ["housing"],
    summary: "Delivers substantial new housing (approx. 60,000 units 2012-2027, extended by PfE) focusing on brownfield land and the Inner Areas.",
    text: "Approximately 60,000 new dwellings will be provided... 90% of residential development will be on previously developed land. High-density developments are appropriate in the City Centre and Regional Centre. New housing will address demographic needs and support economic growth."
  },
  {
    reference: "EN4 / JP-S2",
    title: "Reducing CO2 Emissions & Zero Carbon",
    section: "Environment",
    topics: ["environment"],
    summary: "Targets net zero carbon by 2038. Requires energy efficiency, retrofit, and low-carbon infrastructure in new developments.",
    text: "The Council will seek to reduce fuel poverty and decouple growth from CO2 emissions. All development must follow the Energy Hierarchy... aiming for net zero carbon. Strategic areas for low and zero-carbon decentralised energy infrastructure include the Regional Centre and Airport."
  },
  {
    reference: "T1 / JP-C1",
    title: "Sustainable Transport",
    section: "Transport",
    topics: ["transport"],
    summary: "Promotes a modal shift to walking, cycling, and public transport. Supports Metrolink expansion and active travel networks.",
    text: "To deliver a sustainable, high-quality, integrated transport system to encourage modal shift away from car travel... Proposals will be supported that improve choice, promote regeneration, and reduce the negative impacts of road traffic. Priorities include Metrolink extensions and the Bee Network."
  },
  {
    reference: "EC7",
    title: "Eastlands Strategic Employment Location",
    section: "Economy",
    topics: ["economy", "place"],
    summary: "Development of a major sports and leisure visitor destination at Eastlands (Sportcity), linked to Manchester City FC.",
    text: "Eastlands... is suitable for a major sports and leisure visitor destination with complementary commercial, retail and hotels. Proposals should support the continued social, economic and physical regeneration of East Manchester and place design at the heart of any scheme."
  }
];