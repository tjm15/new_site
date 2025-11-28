// Mock GeoJSON-like structures for Manchester
// A rough approximation of Manchester's elongated north-south shape
export const BOROUGH_OUTLINE = "M 250,50 L 350,50 L 420,200 L 380,350 L 450,450 L 400,650 L 250,850 L 150,750 L 100,550 L 180,350 L 150,150 Z";

export const CONSTRAINTS = [
  {
    id: "green_belt_north",
    label: "Green Belt (Heaton Park area)",
    type: "green",
    path: "M 250,50 L 350,50 L 340,120 L 260,120 Z",
    color: "rgba(76, 175, 80, 0.3)"
  },
  {
    id: "green_belt_south",
    label: "Green Belt (Airport/Ringway)",
    type: "green",
    path: "M 250,750 L 350,750 L 300,850 L 200,800 Z",
    color: "rgba(76, 175, 80, 0.3)"
  },
  {
    id: "river_mersey",
    label: "Mersey Valley (Flood Zone/Green Corridor)",
    type: "water",
    path: "M 100,550 L 450,550 L 450,580 L 100,580 Z",
    color: "rgba(33, 150, 243, 0.2)"
  },
  {
    id: "city_centre_conservation",
    label: "City Centre Conservation Areas",
    type: "heritage",
    path: "M 280,380 L 320,380 L 320,420 L 280,420 Z",
    color: "rgba(233, 30, 99, 0.15)"
  }
];

export const CENTRES = [
  { id: "city_centre", label: "City Centre", x: 300, y: 400 },
  { id: "cheetham_hill", label: "Cheetham Hill", x: 300, y: 300 },
  { id: "eastlands", label: "Eastlands", x: 380, y: 410 },
  { id: "chorlton", label: "Chorlton", x: 220, y: 520 },
  { id: "fallowfield", label: "Fallowfield", x: 320, y: 530 },
  { id: "didsbury", label: "Didsbury", x: 300, y: 600 },
  { id: "wythenshawe", label: "Wythenshawe", x: 280, y: 700 }
];

// Strategic Allocations and Growth Areas (based on Core Strategy & PfE)
export const ALLOCATIONS = [
  {
    id: "city_centre_growth",
    policyRef: "CC1/JP-Strat2",
    name: "City Centre Core & Fringe",
    category: "High Density Mixed Use",
    capacity: "16,500+ homes / Major Office",
    path: "M 260,360 L 340,360 L 340,440 L 260,440 Z",
    center: { x: 300, y: 400 },
    strategies: ["growth", "regeneration", "zero_carbon"]
  },
  {
    id: "eastlands",
    policyRef: "EC7",
    name: "Eastlands / Sportcity",
    category: "Leisure & Commercial",
    capacity: "National Visitor Destination",
    path: "M 360,390 L 400,390 L 400,430 L 360,430 Z",
    center: { x: 380, y: 410 },
    strategies: ["regeneration", "leisure"]
  },
  {
    id: "central_park",
    policyRef: "EC6",
    name: "Central Park",
    category: "Digital & Tech",
    capacity: "Employment Hub",
    path: "M 340,320 L 380,320 L 380,360 L 340,360 Z",
    center: { x: 360, y: 340 },
    strategies: ["growth", "tech"]
  },
  {
    id: "airport_city",
    policyRef: "EC11/MA1/JP-Strat10",
    name: "Airport City & Enterprise Zone",
    category: "International Business & Logistics",
    capacity: "Global Gateway",
    path: "M 250,720 L 320,720 L 320,780 L 250,780 Z",
    center: { x: 285, y: 750 },
    strategies: ["growth", "connectivity"]
  },
  {
    id: "northern_gateway",
    policyRef: "JP-Strat7",
    name: "Northern Gateway (Joint)",
    category: "Strategic Employment/Housing",
    capacity: "Transformational Growth",
    path: "M 280,150 L 350,150 L 350,200 L 280,200 Z",
    center: { x: 315, y: 175 },
    strategies: ["growth", "employment"]
  }
];

export const STRATEGIES = [
  { 
    id: "growth", 
    label: "Economic Growth", 
    desc: "Focus on high-density employment and housing in the Core Growth Area." 
  },
  { 
    id: "regeneration", 
    label: "Neighbourhood Regeneration", 
    desc: "Revitalising Inner Areas and District Centres." 
  },
  { 
    id: "zero_carbon", 
    label: "Zero Carbon 2038", 
    desc: "Retrofit, active travel, and low-carbon infrastructure." 
  },
  { 
    id: "connectivity", 
    label: "Global Connectivity", 
    desc: "Maximising the potential of the Airport and HS2/NPR links." 
  }
];