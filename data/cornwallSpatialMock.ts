
// Mock GeoJSON-like structures for Cornwall

// A stylized outline of Cornwall (long peninsula shape)
export const BOROUGH_OUTLINE = "M 10,500 L 50,400 L 150,250 L 300,150 L 500,100 L 700,50 L 850,150 L 820,300 L 750,350 L 600,400 L 450,450 L 300,550 L 150,600 L 50,580 Z";

export const CONSTRAINTS = [
  {
    id: "aonb_penwith",
    label: "Cornwall AONB (West Penwith)",
    type: "protected",
    path: "M 10,500 L 40,450 L 80,480 L 60,550 Z",
    color: "rgba(34, 139, 34, 0.2)"
  },
  {
    id: "aonb_roseland",
    label: "Cornwall AONB (Roseland)",
    type: "protected",
    path: "M 400,450 L 450,420 L 480,480 L 420,500 Z",
    color: "rgba(34, 139, 34, 0.2)"
  },
  {
    id: "whs_mining",
    label: "World Heritage Site (Mining)",
    type: "heritage",
    path: "M 150,450 L 200,430 L 220,460 L 170,480 Z",
    color: "rgba(255, 152, 0, 0.15)"
  },
  {
    id: "bodmin_moor",
    label: "Bodmin Moor (AONB)",
    type: "protected",
    path: "M 550,200 L 650,180 L 680,250 L 580,280 Z",
    color: "rgba(34, 139, 34, 0.25)"
  }
];

export const CENTRES = [
  { id: "truro", label: "Truro (City)", x: 400, y: 380 },
  { id: "penzance", label: "Penzance", x: 80, y: 520 },
  { id: "falmouth", label: "Falmouth", x: 380, y: 450 },
  { id: "newquay", label: "Newquay", x: 350, y: 250 },
  { id: "st_austell", label: "St Austell", x: 500, y: 350 },
  { id: "bodmin", label: "Bodmin", x: 550, y: 280 },
  { id: "camborne", label: "Camborne", x: 200, y: 450 },
  { id: "launceston", label: "Launceston", x: 750, y: 180 },
  { id: "bude", label: "Bude", x: 700, y: 80 }
];

// Mock Allocations linked to policies
export const ALLOCATIONS = [
  {
    id: "west_carclaze",
    policyRef: "Policy 3",
    name: "West Carclaze Eco-community",
    category: "Eco-community",
    capacity: "1,500 homes",
    path: "M 510,330 L 540,330 L 540,360 L 510,360 Z",
    center: { x: 525, y: 345 },
    strategies: ["growth", "eco_communities"]
  },
  {
    id: "par_docks",
    policyRef: "Policy 3",
    name: "Par Docks",
    category: "Regeneration",
    capacity: "500 homes",
    path: "M 540,370 L 560,370 L 560,390 L 540,390 Z",
    center: { x: 550, y: 380 },
    strategies: ["growth", "eco_communities"]
  },
  {
    id: "newquay_growth",
    policyRef: "PP8",
    name: "Newquay Strategic Route",
    category: "Urban Extension",
    capacity: "4,400 homes (total CNA)",
    path: "M 360,260 L 390,260 L 385,290 L 355,290 Z",
    center: { x: 370, y: 275 },
    strategies: ["growth", "market_towns"]
  },
  {
    id: "truro_threemilestone",
    policyRef: "PP6",
    name: "Truro & Threemilestone",
    category: "Urban Extension",
    capacity: "3,900 homes",
    path: "M 380,370 L 420,370 L 415,400 L 375,400 Z",
    center: { x: 400, y: 385 },
    strategies: ["growth", "market_towns"]
  },
  {
    id: "hayle_harbour",
    policyRef: "PP2",
    name: "Hayle Harbour",
    category: "Waterfront Regeneration",
    capacity: "1,600 homes (total CNA)",
    path: "M 150,480 L 170,480 L 170,500 L 150,500 Z",
    center: { x: 160, y: 490 },
    strategies: ["market_towns"]
  }
];

export const STRATEGIES = [
  { 
    id: "growth", 
    label: "Dispersed Growth", 
    desc: "Distributes 52,500 homes across the network of towns and eco-communities.",
    includedSites: ["west_carclaze", "newquay_growth", "truro_threemilestone", "par_docks", "hayle_harbour"]
  },
  { 
    id: "eco_communities", 
    label: "Eco-Communities", 
    desc: "Focuses on exemplar sustainable settlements at West Carclaze and Par Docks.",
    includedSites: ["west_carclaze", "par_docks"]
  },
  { 
    id: "market_towns", 
    label: "Market Town Regen", 
    desc: "Strengthens the role of main towns like Truro, Newquay, Penzance and Hayle.",
    includedSites: ["truro_threemilestone", "newquay_growth", "hayle_harbour"]
  }
];
