import type { PlanningApplication } from './types';

export const CORNWALL_APPLICATIONS: PlanningApplication[] = [
  {
    id: "cornwall_1",
    reference: "PA24/08765",
    address: "Land South of Truro Road, St Austell, Cornwall TR1 2PQ",
    applicationType: "Outline Planning Permission",
    description: "Outline application for residential development of up to 85 dwellings with associated access, landscaping, and open space (all matters reserved except access).",
    applicant: "Cornish Homes Ltd",
    siteBoundary: "M 490,340 L 520,340 L 520,365 L 490,365 Z",
    keyConstraints: [
      "Greenfield site outside settlement boundary",
      "Agricultural Land Classification Grade 3",
      "Within 500m of St Austell Bay SSSI",
      "Surface water flood risk (low probability)"
    ],
    applicablePolicies: [
      "Policy 1 - Presumption in favour of sustainable development",
      "Policy 2a - Key Targets (52,500 homes)",
      "Policy 3 - Role and function of places",
      "Policy 7 - Housing in the countryside",
      "Policy 8 - Affordable housing (35% target - Zone 3)",
      "Policy 23 - Natural environment"
    ],
    documents: [
      {
        type: "Planning Statement",
        title: "Planning Statement",
        content: `This Planning Statement supports an outline application for up to 85 dwellings on land south of Truro Road, St Austell. The site extends to 3.2 hectares and currently comprises agricultural grassland.

St Austell is identified in the Cornwall Local Plan as a main town where strategic scale growth will be accommodated to support regeneration and self-sufficient communities. The town has a housing target of approximately 3,900 dwellings to 2030 as part of the wider St Austell & Mevagissey Community Network Area (CNA).

Whilst the site lies outside the current settlement boundary, the delivery of new homes is essential to meet Cornwall's housing needs and the site represents a logical and sustainable extension to the town. The site is well-related to existing development, with St Austell town centre 1.2km to the north and local services including a primary school within 800m walking distance.

The proposal will deliver 30 affordable homes (35% in accordance with Policy 8 Zone 3 requirements), prioritising family housing and addressing local need evidenced in the Cornwall Housing Register. The scheme will provide a range of house types including bungalows suitable for older persons, contributing to the diverse housing mix required by the Local Plan.

Access will be taken from Truro Road via a new priority junction with footway connections to existing pedestrian networks. A comprehensive landscape strategy will provide substantial buffer planting, a Suitable Alternative Natural Greenspace (SANG) to mitigate potential impacts on St Austell Bay SSSI, and equipped play areas serving both the development and wider community.`
      },
      {
        type: "Design & Access Statement",
        title: "Design & Access Statement",
        content: `The masterplan has been developed through collaborative design workshops and responds to the site's opportunities and constraints. Development parcels are arranged around a central green spine, with housing fronting onto streets and public spaces in accordance with Manual for Streets principles.

The design philosophy draws on traditional Cornish settlement patterns, with development densities decreasing toward the southern edge where the site meets open countryside. The northern portion adjacent to Truro Road will accommodate higher-density terraced and semi-detached housing (35-40 dwellings per hectare), transitioning to lower-density detached homes and bungalows (20-25 dph) along the southern boundary.

Architectural character will reference the local vernacular, with pitched slate roofs, rendered and stone elevations, and simple window proportions. A palette of complementary materials —  including natural slate, wet-dash render in muted tones, and Cornish stone detailing — will create visual variety while maintaining coherence with the surrounding area.

Sustainability is embedded in the design approach. All homes will achieve a minimum of 19% carbon reduction over Part L 2013, with options for PV panels and electric vehicle charging points. The layout maximises solar orientation, with primary living spaces facing south where possible. SuDS features including swales, detention basins, and permeable paving will manage surface water runoff and enhance biodiversity.

The reserved matters submissions will demonstrate compliance with Policy 14 (renewable energy) and Policy 23 (natural environment), with detailed landscape proposals including native tree planting, species-rich grassland, and wildlife corridors linking to adjacent habitats.`
      },
      {
        type: "Ecological Assessment",
        title: "Ecological Impact Assessment",
        content: `Extended Phase 1 habitat surveys were undertaken in April and August 2024, with targeted species surveys for bats, reptiles, and nesting birds. The site comprises improved grassland of low ecological value, with species-poor swards dominated by perennial rye-grass.

Boundary hedgerows and mature trees along the western edge provide habitat connectivity and were assessed as having moderate ecological value. These features will be retained and enhanced through gapping up with native species (hawthorn, blackthorn, hazel) and the creation of 10m buffer zones with reduced management regimes.

No evidence of protected species was recorded, although the hedgerows provide suitable habitat for nesting birds. A precautionary approach will be adopted with vegetation clearance timed outside the bird nesting season (March-August inclusive) or preceded by nesting bird checks.

The site lies 480m from St Austell Bay SSSI, designated for its geological interest. Following consultation with Natural England, a 2.5-hectare SANG will be provided within the southern portion of the site, including circular walking routes, seating, and interpretation boards. This will reduce recreational pressure on the SSSI and deliver a net gain in accessible greenspace.

Biodiversity Net Gain calculations demonstrate a 15.2% increase in habitat units through the creation of species-rich grassland, native hedgerow planting, and wildlife ponds. A Landscape and Ecological Management Plan (LEMP) will secure long-term management and monitoring, with opportunities for community engagement in habitat creation and maintenance.`
      },
      {
        type: "Transport Assessment",
        title: "Transport Statement",
        content: `The Transport Statement assesses the highway impacts of 85 dwellings accessed from Truro Road. Trip generation estimates based on TRICS data predict 51 two-way vehicle movements during the AM peak and 48 during the PM peak.

The proposed access will be a simple priority junction with 2.4m x 43m visibility splays in both directions, achievable within land controlled by the applicant. Truro Road is subject to a 30mph speed limit at this location, with recorded speeds consistent with the posted limit.

Internal roads will be designed to adoptable standards (5.5m carriageway with 2m footways), with traffic calming features including 20mph speed limits, raised tables, and shared surface areas. Pedestrian links will connect to existing footways on Truro Road, providing safe routes to local services and public transport.

Bus services operate along Truro Road with stops 200m from the site entrance, providing hourly connections to St Austell town centre and Truro. The development will contribute £68,000 (index-linked) toward enhanced bus service frequency via Section 106 agreement.

Parking provision aligns with Cornwall Council standards: 2 spaces per dwelling for 3+ bedroom homes, with visitor parking at 1 space per 5 dwellings. All properties will include secure cycle storage and electric vehicle charging points, supporting the transition to sustainable transport in accordance with Policy 14 (renewable and low carbon energy).`
      }
    ],
    consultationResponses: [
      {
        respondent: "Cornwall Council Highways",
        type: "support",
        summary: "No objection subject to Section 278 agreement and conditions",
        fullText: "The Highway Authority has no objection to the proposed development subject to the access being constructed to adoptable standards..."
      },
      {
        respondent: "Natural England",
        type: "comment",
        summary: "No objection subject to SANG provision and LEMP",
        fullText: "Natural England has assessed the application and advises no objection subject to the provision of SANG and the submission of a detailed LEMP..."
      },
      {
        respondent: "St Austell Town Council",
        type: "object",
        summary: "Concern about development outside settlement boundary and impact on local services",
        fullText: "The Town Council objects to the application as the site lies outside the settlement boundary. There are concerns about the cumulative impact on local infrastructure..."
      },
      {
        respondent: "Local resident (Truro Road)",
        type: "comment",
        summary: "Worried about traffic but also wants new play area",
        fullText: "Traffic is already bad on Truro Road; this will make it worse. But if it must happen, please provide a proper play area, a safe crossing to the bus stop, and keep construction trucks off school run hours."
      },
      {
        respondent: "Anonymous postcard (illegible)",
        type: "object",
        summary: "Disjointed remarks about bats, buses, and \"city folk\"",
        fullText: "Bats. Buses. People from city bringing noise. No more lights! Also where do the cows go? This is NOT the town centre. (handwriting unclear and contradictory)"
      }
    ]
  },
  {
    id: "cornwall_2",
    reference: "PA24/09234",
    address: "The Old Dairy, Trebartha Farm, Launceston, Cornwall PL15 9RX",
    applicationType: "Full Planning Permission",
    description: "Conversion of redundant agricultural building to 2 dwellings (Class C3) with associated parking and amenity space.",
    applicant: "Mr J. Penhaligon",
    siteBoundary: "M 740,175 L 750,175 L 750,185 L 740,185 Z",
    keyConstraints: [
      "Open countryside location",
      "Within Cornwall AONB",
      "Traditional stone barn of local architectural interest"
    ],
    applicablePolicies: [
      "Policy 1 - Presumption in favour",
      "Policy 7 - Housing in the countryside",
      "Policy 23 - Natural environment (AONB)",
      "Policy 24 - Historic environment"
    ],
    documents: [
      {
        type: "Planning Statement",
        title: "Planning & Heritage Statement",
        content: `This application seeks full planning permission for the conversion of a redundant agricultural building to two dwellings at The Old Dairy, Trebartha Farm.

The building is a traditional Cornish stone barn dating from circa 1840, constructed of local granite with a slate roof. The barn has not been used for agricultural purposes for over 15 years and is in declining condition, with areas of stonework deterioration and roof slippage.

Policy 7 (Housing in the countryside) permits the reuse of suitably constructed redundant buildings in the open countryside. The barn is of substantial construction with granite walls averaging 600mm thick and a slate-covered timber roof structure. The building is capable of conversion without major reconstruction, with the principal elevations and roof to be retained in their entirety.

The conversion will deliver two 2-bedroom cottages suitable for year-round occupation, contributing to the supply of smaller homes in rural Cornwall identified as a priority in the Local Plan. The scheme will secure the future of a traditional farm building of local architectural interest and will prevent further deterioration and potential collapse.

The site lies within the Cornwall AONB, and the design approach prioritises minimal intervention and the retention of traditional character. All new openings will be formed in existing apertures or areas of previous alteration, with no new openings proposed in principal elevations. The proposal complies with Policy 23, which permits development in the AONB where it conserves landscape character and scenic beauty.`
      },
      {
        type: "Design & Access Statement",
        title: "Conversion Strategy",
        content: `The conversion strategy follows a conservation-led approach, retaining the building's agricultural character while introducing necessary domestic amenities.

External alterations will be limited to: restoration of stonework using lime mortar and reclaimed granite; repair of the slate roof using natural Delabole slates; formation of windows and doors within existing openings; and installation of conservation-style rooflights to secondary roofslopes.

The internal layout divides the barn longitudinally into two dwellings, with a central party wall constructed of stone to match the existing construction. Each unit will have ground floor living/kitchen/dining space and first floor bedrooms within the roof structure, accessed via new timber staircases positioned to minimise impact on roof trusses.

Materials will be entirely traditional: stonework repaired to match existing using lime mortar and local granite; roof recovered with natural slate; timber windows and doors painted in heritage colours; and minimal external lighting to protect the dark skies character of the AONB.

Parking will be provided on existing hardstanding areas, with no new areas of surfacing required. Gardens will be defined by native hedgerow planting and traditional Cornish hedging (earth banks with stone facing), in keeping with the rural landscape character.`
      }
    ],
    consultationResponses: [
      {
        respondent: "Cornwall AONB Unit",
        type: "support",
        summary: "Supportive of conservation-led approach",
        fullText: "The AONB Unit supports the application, which will secure the future of a traditional farm building using appropriate materials and minimal intervention..."
      },
      {
        respondent: "Neighbour (unverified email)",
        type: "object",
        summary: "Confused about access, drainage, and whether barn is listed",
        fullText: "Is this barn listed? Not sure. Worried the lane will flood if more drains are added. Also how do ambulances turn? Please explain in words people can understand, not just drawings."
      },
      {
        respondent: "Parish council clerk",
        type: "comment",
        summary: "Neutral but requests construction hours and lighting limits",
        fullText: "No formal objection provided hours are limited (08:00-18:00 weekdays), lighting is downward-facing and minimal due to dark skies, and bats are checked before any roof removal."
      }
    ]
  }
];
