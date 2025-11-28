
// Mock GeoJSON-like structures for the SVG map

// A rough approximation of Camden's shape (kite/wedge like)
export const BOROUGH_OUTLINE = "M 200,50 L 450,100 L 550,400 L 400,700 L 300,850 L 200,800 L 100,500 L 50,200 Z";

export const CONSTRAINTS = [
  {
    id: "hampstead_heath",
    label: "Hampstead Heath (MOL)",
    type: "green",
    path: "M 150,150 L 350,180 L 320,300 L 120,250 Z",
    color: "rgba(76, 175, 80, 0.3)"
  },
  {
    id: "regents_park",
    label: "Regents Park (Part)",
    type: "green",
    path: "M 100,500 L 200,500 L 200,650 L 100,600 Z",
    color: "rgba(76, 175, 80, 0.3)"
  },
  {
    id: "rail_lands",
    label: "Rail Infrastructure",
    type: "infrastructure",
    path: "M 300,850 L 320,600 L 550,400 L 560,420 L 340,620 L 320,860 Z",
    color: "rgba(100, 100, 100, 0.15)"
  },
  {
    id: "conservation_bloomsbury",
    label: "Bloomsbury Conservation Area",
    type: "heritage",
    path: "M 350,700 L 500,720 L 480,820 L 330,800 Z",
    color: "rgba(233, 30, 99, 0.15)"
  }
];

export const CENTRES = [
  { id: "camden_town", label: "Camden Town", x: 320, y: 550 },
  { id: "kentish_town", label: "Kentish Town", x: 350, y: 400 },
  { id: "kings_cross", label: "King's Cross", x: 450, y: 600 },
  { id: "euston", label: "Euston", x: 350, y: 650 },
  { id: "west_hampstead", label: "West Hampstead", x: 150, y: 350 },
  { id: "holborn", label: "Holborn", x: 400, y: 800 }
];

// Mock Allocations linked to policies
export const ALLOCATIONS = [
  {
    id: "regis_road",
    policyRef: "C2",
    name: "Regis Road",
    category: "Mixed Use Intensification",
    capacity: "1,000 homes",
    path: "M 360,380 L 420,390 L 410,440 L 350,430 Z",
    center: { x: 385, y: 410 },
    strategies: ["growth", "industry_led"]
  },
  {
    id: "murphy_yard",
    policyRef: "C3",
    name: "Murphy's Yard",
    category: "Mixed Use Intensification",
    capacity: "750 homes",
    path: "M 300,420 L 350,430 L 340,480 L 290,470 Z",
    center: { x: 320, y: 450 },
    strategies: ["growth", "industry_led"]
  },
  {
    id: "o2_centre",
    policyRef: "W2",
    name: "O2 Centre",
    category: "Town Centre Renewal",
    capacity: "1,800 homes",
    path: "M 180,380 L 240,390 L 230,440 L 170,430 Z",
    center: { x: 205, y: 410 },
    strategies: ["growth", "town_centre"]
  },
  {
    id: "euston_station",
    policyRef: "S2",
    name: "Euston Station OSD",
    category: "Strategic Transport Hub",
    capacity: "2,500 homes",
    path: "M 320,630 L 400,630 L 400,680 L 320,680 Z",
    center: { x: 360, y: 655 },
    strategies: ["growth", "knowledge_quarter"]
  },
  {
    id: "camley_street",
    policyRef: "S5",
    name: "Camley Street",
    category: "Housing & Industry",
    capacity: "350 homes",
    path: "M 420,550 L 460,560 L 450,600 L 410,590 Z",
    center: { x: 435, y: 575 },
    strategies: ["knowledge_quarter", "industry_led"]
  },
  {
    id: "mount_pleasant",
    policyRef: "S14",
    name: "Mount Pleasant",
    category: "Infill",
    capacity: "150 homes",
    path: "M 450,750 L 490,750 L 490,790 L 450,790 Z",
    center: { x: 470, y: 770 },
    strategies: ["growth"]
  }
];

export const STRATEGIES = [
  { 
    id: "growth", 
    label: "Maximum Growth", 
    desc: "Maximises housing delivery across all identified opportunity areas.",
    includedSites: ["regis_road", "murphy_yard", "o2_centre", "euston_station", "camley_street", "mount_pleasant"]
  },
  { 
    id: "knowledge_quarter", 
    label: "Innovation-Led", 
    desc: "Focuses density around the Knowledge Quarter (Euston/King's Cross) to support science and tech.",
    includedSites: ["euston_station", "camley_street", "regis_road"]
  },
  { 
    id: "town_centre", 
    label: "Polycentric", 
    desc: "Distributes growth to strengthen existing town centres like West Hampstead and Kentish Town.",
    includedSites: ["o2_centre", "regis_road", "murphy_yard"]
  }
];
