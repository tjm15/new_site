import type { PlanningApplication } from './types';

export const CAMDEN_APPLICATIONS: PlanningApplication[] = [
  {
    id: "camden_1",
    reference: "2024/5678/P",
    address: "45 Kentish Town Road, London NW1 8NX",
    applicationType: "Full Planning Permission",
    description: "Demolition of existing two-storey commercial building and erection of part 8, part 9-storey mixed-use building comprising retail (Class E) at ground floor, and 52 residential units (Class C3) above, with associated cycle parking, refuse storage, and landscaping.",
    applicant: "Kentish Town Developments Ltd",
    siteBoundary: "M 350,420 L 360,420 L 360,435 L 350,435 Z",
    keyConstraints: [
      "Adjacent to Kentish Town Conservation Area",
      "Site lies within Archaeological Priority Area",
      "PTAL 4 (Good public transport accessibility)",
      "Article 4 Direction (HMO) applies"
    ],
    applicablePolicies: [
      "DS1 - Good Growth",
      "H1 - Housing Supply",
      "H4 - Affordable Housing (50% target)",
      "D2 - Tall Buildings",
      "T1 - Sustainable Transport",
      "CC1 - Climate Emergency"
    ],
    documents: [
      {
        type: "Planning Statement",
        title: "Planning Statement",
        content: `This Planning Statement has been prepared in support of a full planning application for the comprehensive redevelopment of 45 Kentish Town Road, NW1.

The site currently comprises a two-storey commercial building of no architectural merit, constructed in the 1970s using prefabricated concrete panels. The building is currently vacant and has been marketed unsuccessfully for commercial use for over 18 months. The site occupies a prominent corner position within the Kentish Town district centre and represents a significantly underutilised brownfield site in a highly accessible location.

The proposed development will deliver 52 new homes, including 26 affordable housing units (50% by habitable room) in accordance with Policy H4. The tenure split will be 60% social rent and 40% intermediate housing, prioritising family-sized units. The scheme includes 12 three-bedroom units suitable for family occupation, addressing the Council's identified need for larger homes.

The development will make a significant contribution toward Camden's housing target of 11,550 homes, optimising the use of previously developed land in a sustainable location with excellent public transport links (PTAL 4). The scheme aligns with the spatial strategy set out in Policy C1 (Central Camden Strategy), which identifies Kentish Town as a focus for growth and regeneration.

Ground floor retail space (280 sqm) will activate the street frontage and support the vitality of Kentish Town district centre, in accordance with Policy IE6 (Town Centres). The scheme is car-free, with 104 secure cycle parking spaces provided in accordance with London Plan standards, supporting Policy T1 (Sustainable Transport) and the Council's commitment to reduce car dependency.`
      },
      {
        type: "Design & Access Statement",
        title: "Design & Access Statement",
        content: `The design approach responds carefully to the site's context at the threshold between Kentish Town's historic high street and the emerging residential character to the east. The building is conceived as a contemporary addition to the townscape, respectful of the conservation area setting while expressing its own architectural clarity.

The massing strategy steps down from 9 storeys at the corner (addressing Kentish Town Road) to 8 storeys along the secondary elevation, responding to the varied roofline and scale of the surrounding area. This approach has been developed through pre-application discussions with Camden's Design Review Panel and responds directly to their feedback regarding contextual height and the need to mediate between the taller buildings to the south and lower-rise terraces to the north.

Materials have been selected to complement the local palette while providing a durable, low-maintenance facade appropriate to a high-density urban site. The principal elevations will be constructed from high-quality London stock brick with precast concrete detailing at balconies and window surrounds, referencing the robust materiality of the adjacent railway infrastructure. Metal-framed windows with deep reveals will provide visual depth and articulation to the facade.

All residential units will be dual-aspect, maximising daylight and natural ventilation in accordance with Policy D1 (Design Quality). Generous private amenity space is provided via balconies and winter gardens, with a communal roof terrace (150 sqm) accessible to all residents. The building achieves excellent environmental performance, targeting BREEAM Excellent and net zero carbon in operation through high-performance fabric, ASHP heating, and PV panels integrated into the roof design, fully aligning with Policy CC1.`
      },
      {
        type: "Heritage Statement",
        title: "Heritage Assessment",
        content: `The application site lies immediately adjacent to the Kentish Town Conservation Area (designated 1982, extended 2006), which is characterised by Victorian and Edwardian terraced housing of significant townscape value. However, the site itself falls outside the conservation area boundary and contains no heritage assets.

A detailed assessment of views and settings has been undertaken in accordance with Historic England guidance. The proposed development will be visible in oblique views along Kentish Town Road when approaching from the south, and will form part of the backdrop to the conservation area when viewed from Prince of Wales Road. However, given the existing varied building heights along this section of Kentish Town Road — including the 1960s four-storey former Co-op building and the more recent six-storey residential block — the introduction of a taller building at this corner location will not appear incongruous.

The development will not interrupt key views of St Benet's Church or other landmark buildings within the conservation area. The use of high-quality brick and the articulation of the facade through setbacks and materials will ensure the development complements rather than overwhelms the finer-grain historic buildings nearby. The retention and enhancement of the ground floor retail frontage will preserve the commercial character of this part of Kentish Town Road, which has been a defining feature since the Victorian era.

No archaeological remains of significance are anticipated, although a condition requiring a watching brief during groundworks would be appropriate given the site's location within an Archaeological Priority Area.`
      },
      {
        type: "Transport Statement",
        title: "Transport Statement",
        content: `The site benefits from excellent public transport accessibility, with a PTAL rating of 4 (Good). Kentish Town Underground (Northern Line) and Kentish Town West Overground stations are both within 400m walking distance, providing direct services to central London, the City, and Stratford.

The development is proposed as car-free, with no general parking provision. This approach is supported by Policy T5 (Car Parking) and reflects the sustainable transport objectives of the Camden Local Plan and London Plan. Two accessible parking spaces will be provided for Blue Badge holders in accordance with London Plan standards, with potential for future spaces to be allocated via a Parking Design and Management Plan (to be secured by condition).

Cycle parking provision significantly exceeds London Plan minimum standards, with 104 long-stay spaces provided in a secure ground floor cycle store (accessed via Sheffield stands and a dedicated cycle route from the street), and 6 short-stay visitor spaces at street level. The cycle store will include facilities for adapted cycles and cargo bikes to support sustainable family living.

Servicing and refuse collection will take place from Kentish Town Road during off-peak hours (10:00-16:00), controlled via a Delivery and Servicing Plan to be secured by Section 106 agreement. A Construction Logistics Plan will manage construction traffic and minimise disruption to the local highway network. The development will contribute £52,000 toward local transport improvements via Section 106, supporting enhanced walking and cycling infrastructure in Kentish Town district centre.`
      }
    ],
    consultationResponses: [
      {
        respondent: "Kentish Town Neighbourhood Forum",
        type: "comment",
        summary: "Concern about height and density, but support for affordable housing provision",
        fullText: "While we welcome the provision of 50% affordable housing and the car-free approach, we have concerns about the height of the building at 9 storeys, which exceeds the prevailing height in this part of Kentish Town..."
      },
      {
        respondent: "Transport for London",
        type: "support",
        summary: "No objection subject to cycle parking details and construction logistics plan",
        fullText: "TfL has no objection to the proposal subject to the submission and approval of full cycle parking details and a Construction Logistics Plan..."
      },
      {
        respondent: "Local resident (42 Kentish Town Road)",
        type: "object",
        summary: "Concerns about overshadowing and loss of daylight to neighbouring properties",
        fullText: "I object to this application on the grounds that the proposed building will overshadow our property and result in an unacceptable loss of daylight..."
      },
      {
        respondent: "Camden Cycling Campaign",
        type: "comment",
        summary: "Support car-free but baffled by bin store on desire line",
        fullText: "Support the car-free stance and extra cycle parking. However the refuse store blocks the only step-free desire line to Kentish Town Road which makes no sense; please redesign or you will create your own conflict point."
      },
      {
        respondent: "Anonymous online form",
        type: "object",
        summary: "Stream-of-consciousness note about height, bins, pigeons",
        fullText: "this block is too high too near too soon. pigeons will live in the balconies. Also where do the bins go? If the bins are wrong then the building is wrong. (ps: still want the affordable homes but not like this)"
      }
    ]
  },
  {
    id: "camden_2",
    reference: "2024/3421/P",
    address: "12 Grafton Road, London NW5 3DX",
    applicationType: "Householder Application",
    description: "Single-storey rear extension, loft conversion with rear dormer window, and installation of rear rooflights.",
    applicant: "Mr & Mrs Thompson",
    siteBoundary: "M 320,385 L 325,385 L 325,390 L 320,390 Z",
    keyConstraints: [
      "Within Grafton Road Conservation Area",
      "Article 4 Direction restricts permitted development rights"
    ],
    applicablePolicies: [
      "D1 - Design Quality",
      "D4 - Heritage Assets",
      "H12 - Residential Extensions"
    ],
    documents: [
      {
        type: "Planning Statement",
        title: "Supporting Planning Statement",
        content: `This application seeks planning permission for modest alterations and extensions to a mid-terrace Victorian dwelling at 12 Grafton Road, situated within the Grafton Road Conservation Area.

The property is a two-storey Victorian terrace house typical of the area, constructed circa 1880. The proposed works comprise three elements: a single-storey rear extension (3.5m deep), a loft conversion with rear dormer window, and the installation of two conservation-style rooflights to the front roofslope.

The rear extension has been designed to respect the character of the host building and Conservation Area, using matching London stock brick and a flat roof with parapet detailing to match the existing rear elevation. The extension will be set back from both side boundaries and will not extend beyond the established building line of neighbouring extensions.

The rear dormer has been carefully proportioned to sit comfortably within the roofslope, set in from the party walls and eaves, and finished in lead to match traditional dormers in the Conservation Area. The front rooflights will be conservation-style units, installed flush with the roofslope to minimise visual impact on the streetscene.

The works are necessary to provide additional living space for a growing family and to improve the thermal performance of the property in line with the Council's climate emergency objectives. The scheme has been designed in close consultation with the Council's Conservation Officer and fully respects the special character of the Grafton Road Conservation Area.`
      },
      {
        type: "Design & Access Statement",
        title: "Design Statement",
        content: `The design approach has been guided by the Grafton Road Conservation Area Appraisal and the Council's adopted design guidance for residential extensions.

The rear extension is subordinate in scale to the main house, extending 3.5m from the rear wall and maintaining a width of 3.2m. The flat roof design with parapet detailing is a characteristic feature of Victorian rear additions in the area and is considered more appropriate than a pitched roof, which would appear bulky when viewed from neighbouring gardens.

Materials will match the existing: yellow London stock brick in Flemish bond, painted timber sash windows, and lead detailing to the parapet capping. The extension will be set down from the main roof ridge by 450mm and set in from both boundaries by 150mm, maintaining a sense of subservience and ensuring adequate separation from neighbouring properties.

The loft conversion will provide a third bedroom with ensuite, addressing the family's space needs without extending the building footprint. The rear dormer has been designed in accordance with the Council's SPD guidance, measuring 2.8m wide and set in 500mm from each party wall. The 300mm setback from the eaves ensures the dormer sits comfortably within the roofslope without appearing top-heavy. Lead cladding and a pitched roof with slate covering will ensure the dormer harmonises with the character of the Conservation Area.

Front rooflights have been specified as conservation-style units with slim profiles and flush installation to maintain the clean lines of the front roofslope. The units will be positioned symmetrically and set back from the ridge to minimise visual impact when viewed from street level.`
      }
    ],
    consultationResponses: [
      {
        respondent: "Victorian Society",
        type: "comment",
        summary: "No objection in principle, recommend lead for dormer cladding",
        fullText: "The Victorian Society has reviewed the application and has no objection in principle to the modest extensions proposed, which are typical of alterations to Victorian terraces..."
      },
      {
        respondent: "Neighbour (Grafton Rd)",
        type: "object",
        summary: "Worried about party wall noise and dust",
        fullText: "We already had scaffolding from three different jobs on this street this year. Another dormer means more drilling into the party wall; we need reassurance on noise hours and dust suppression or we will keep objecting."
      },
      {
        respondent: "Design student (unclear)",
        type: "comment",
        summary: "Incoherent aesthetic critique",
        fullText: "Dormers are fine but if you flip the fenestration to align with solar punk ideals it could be nice? Unsure. Please do not do pastiche, but also don't do glass. You know?"
      }
    ]
  }
];
