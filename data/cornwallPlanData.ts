
export const PLAN_CONTEXT = {
  title: "Cornwall Local Plan: Strategic Policies",
  authority: "Cornwall Council",
  status: "Adopted (2010-2030)",
  summary: "The Cornwall Local Plan sets out the planning approach for the period to 2030. It aims to deliver 52,500 new homes and 38,000 jobs, whilst protecting Cornwall's special environment. Key themes include balancing housing and economic growth, enabling self-sufficient communities, promoting health and wellbeing, and making the most of the environment (AONBs, World Heritage Sites). It focuses on a dispersed development pattern across Community Network Areas (CNAs).",
  keyIssues: [
    "Housing Affordability & Local Needs",
    "Economic Growth (Marine, Agri-tech, Aerospace)",
    "Rural Connectivity & Transport",
    "Protecting AONB & Heritage Coast",
    "Eco-communities & Sustainability"
  ]
};

export const TOPICS = [
  { id: "housing", label: "Housing", color: "#e91e63" },
  { id: "economy", label: "Economy & Tourism", color: "#ff9800" },
  { id: "environment", label: "Environment & Heritage", color: "#4caf50" },
  { id: "transport", label: "Transport & Infrastructure", color: "#2196f3" },
  { id: "community", label: "Health & Community", color: "#00bcd4" }
];

export const POLICIES = [
  {
    reference: "Policy 1",
    title: "Presumption in favour of sustainable development",
    section: "Strategic",
    topics: ["housing", "economy", "environment"],
    summary: "Takes a positive approach reflecting the NPPF presumption in favour of sustainable development. Proposals that accord with the Local Plan will be approved without delay.",
    text: "When considering development proposals the Council will take a positive approach that reflects the presumption in favour of sustainable development... Planning applications that accord with the policies in this Local Plan... will be regarded as sustainable development and be approved, unless material considerations indicate otherwise."
  },
  {
    reference: "Policy 2",
    title: "Spatial Strategy",
    section: "Strategic",
    topics: ["housing", "economy"],
    summary: "Maintains a dispersed development pattern. Strategic growth focused in main towns (e.g., Truro, Newquay, Penzance) and Eco-communities to support regeneration.",
    text: "New development should provide a sustainable approach to accommodating growth... This should maintain the dispersed development pattern of Cornwall and provide homes and jobs based on the role and function of each place. Strategic scale growth will be accommodated in our main towns and city."
  },
  {
    reference: "Policy 2a",
    title: "Key Targets",
    section: "Strategic",
    topics: ["housing", "economy"],
    summary: "Sets targets for 52,500 homes and 38,000 jobs by 2030. Includes 318 Gypsy & Traveller pitches and 2,550 bed spaces for older persons.",
    text: "The Local Plan will provide... 1. A minimum of 52,500 homes at an average rate of about 2,625 per year to 2030... 3. Provide for 38,000 full time jobs and 704,000 sq. metres of employment floorspace... 5. The provision of 2,550 bed spaces in communal establishments for older persons."
  },
  {
    reference: "Policy 3",
    title: "Role and function of places",
    section: "Strategic",
    topics: ["housing", "community"],
    summary: "Hierarchy of development. Strategic growth in towns like Bodmin, Falmouth, Truro. Eco-communities at West Carclaze/Baal. Rural exception sites allowed.",
    text: "The scale and mix of uses of development... should be based on the role and function of places. 1. Delivery... will be managed through a Site Allocations DPD or Neighbourhood Plans for [list of main towns]... 2. The provision of eco-communities at West Carclaze/Baal and Par Docks."
  },
  {
    reference: "Policy 5",
    title: "Business and Tourism",
    section: "Economy",
    topics: ["economy"],
    summary: "Supports new employment land, high quality tourism facilities, and rural diversification. Protects existing business space.",
    text: "To ensure a continued supply of appropriate business space, proposals for new employment land and uses should be: a) well integrated with our city, towns and villages... 3. The development of new or upgrading of existing tourism facilities... will be supported where they would be of an appropriate scale."
  },
  {
    reference: "Policy 7",
    title: "Housing in the countryside",
    section: "Housing",
    topics: ["housing", "environment"],
    summary: "Restricts new homes in open countryside to special circumstances: replacement dwellings, subdivision, reuse of redundant buildings, or essential worker needs.",
    text: "The development of new homes in the open countryside will only be permitted where there are special circumstances. New dwellings will be restricted to: 1. Replacement dwellings... 2. subdivision... 3. Reuse of suitably constructed redundant, disused or historic buildings... 4. Temporary accommodation for workers... 5. Full time agricultural/forestry workers."
  },
  {
    reference: "Policy 8",
    title: "Affordable housing",
    section: "Housing",
    topics: ["housing"],
    summary: "Seeks affordable housing contributions. Targets vary by zone: 50% in Zone 1 (e.g. St Minver) down to 25% in Zone 5 (e.g. Camborne).",
    text: "All new housing schemes... of more than 10 dwellings... must contribute towards meeting affordable housing need... Developments should provide the target levels of affordable housing as set out below: 50% in Zone 1, 40% in Zone 2, 35% in Zone 3, 30% in Zone 4, 25% in Zone 5."
  },
  {
    reference: "Policy 14",
    title: "Renewable and low carbon energy",
    section: "Environment",
    topics: ["environment", "economy"],
    summary: "Supports renewable energy that maximises resource use while protecting landscape character (AONB). Wind turbines only in allocated areas.",
    text: "To increase use and production of renewable and low carbon energy generation development proposals will be supported that... maximize the use of the available resource... In and within the setting of Areas of Outstanding Natural Beauty... developments will only be permitted in exceptional circumstances."
  },
  {
    reference: "Policy 23",
    title: "Natural environment",
    section: "Environment",
    topics: ["environment"],
    summary: "Protects Cornwall's distinct landscape, including AONBs, Heritage Coasts, and biodiversity sites. Great weight given to conserving AONB landscape.",
    text: "Development proposals will need to sustain local distinctiveness... 2(a). Great weight will be given to conserving the landscape and scenic beauty within or affecting the setting of the AONB... Major development in the AONB will be refused subject to the tests of exceptional circumstances."
  },
  {
    reference: "Policy 24",
    title: "Historic environment",
    section: "Environment",
    topics: ["design", "environment"],
    summary: "Protects heritage assets, including the Mining World Heritage Site. Supports heritage-led regeneration.",
    text: "The Council will conserve and, where appropriate, enhance Cornwall's rich and diverse heritage assets... Development within the Cornwall and West Devon Mining Landscape World Heritage Site (WHS) and its setting should accord with the WHS Management Plan."
  }
];
