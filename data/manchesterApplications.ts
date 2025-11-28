import type { PlanningApplication } from './types';

export const MANCHESTER_APPLICATIONS: PlanningApplication[] = [
  {
    id: "manchester_1",
    reference: "134567/FO/2024",
    address: "Former Printworks, 89-95 Great Ancoats Street, Manchester M4 5AB",
    applicationType: "Full Planning Permission",
    description: "Demolition of existing industrial building and erection of part 18, part 22-storey building comprising 286 residential apartments (Class C3), flexible commercial space (Class E) at ground floor, with basement parking, cycle storage, and communal amenity space.",
    applicant: "Ancoats Residential Ltd",
    siteBoundary: "M 320,390 L 335,390 L 335,405 L 320,405 Z",
    keyConstraints: [
      "Site within Ancoats Conservation Area",
      "Adjacent to Grade II Listed Murrays' Mills complex",
      "Within Great Ancoats Street Corridor Growth Area",
      "Contaminated land (former industrial use)"
    ],
    applicablePolicies: [
      "SP1 - Spatial Principles",
      "H1 - Overall Housing Provision",
      "EN4 - Reducing CO2 Emissions (2038 net zero target)",
      "T1 - Sustainable Transport",
      "EN3 - Heritage",
      "DM1 - Development Management"
    ],
    documents: [
      {
        type: "Planning Statement",
        title: "Planning Statement",
        content: `This Planning Statement supports a full planning application for the comprehensive redevelopment of the Former Printworks site on Great Ancoats Street, delivering 286 new homes within Manchester's Inner Areas.

The site occupies a pivotal location within the Ancoats Conservation Area and the Great Ancoats Street Growth Corridor, identified in the Core Strategy as a priority area for high-density residential development. The existing building is a mid-20th century industrial structure of limited architectural merit, which makes no positive contribution to the character of the Conservation Area.

The proposal will deliver significant housing growth in line with Policy H1, optimising the use of brownfield land in a highly sustainable location. The scheme includes 20% affordable housing (57 units), with a tenure split of 60% affordable rent and 40% intermediate housing, addressing local housing need and supporting the Council's objective of inclusive growth across neighbourhoods.

The development comprises 137 one-bedroom apartments, 128 two-bedroom apartments, and 21 three-bedroom apartments, providing housing choice and supporting the creation of a balanced residential community. The unit mix responds to identified demand for smaller units in inner-city locations while also delivering family-sized homes to support long-term sustainability.

Ground floor flexible commercial space (450 sqm Class E) will activate the Great Ancoats Street frontage, supporting the vitality of the emerging neighbourhood centre and providing opportunities for independent retailers, cafes, and workspace. Basement parking (52 spaces) is restricted to accessible bays and car club vehicles, supporting the scheme's sustainable transport objectives in line with Policy T1.`
      },
      {
        type: "Design & Access Statement",
        title: "Design & Access Statement",
        content: `The design strategy responds to Ancoats' unique character as Manchester's first industrial suburb, now experiencing comprehensive regeneration as a high-density residential neighbourhood. The proposal draws on the area's industrial heritage while delivering a contemporary building of architectural distinction.

The massing comprises two towers of 18 and 22 storeys, connected by a lower podium element addressing Great Ancoats Street. This arrangement creates visual interest and articulation, breaking down the building's scale and responding to the varied roofline of surrounding development. The taller element is positioned toward the southern end of the site, where it will form part of a cluster of tall buildings emerging along the Great Ancoats Street corridor.

The architectural language references the robust industrial buildings of historic Ancoats through the use of red brick, large-format windows, and strong vertical emphasis. The primary facades will be constructed from high-quality brick with bronze-coloured metal detailing, creating a rich and durable palette appropriate to the Conservation Area setting. Generous glazing at ground floor level will provide active frontage and natural surveillance of the street.

All apartments meet or exceed Nationally Described Space Standards, with 75% dual-aspect to maximise daylight, natural ventilation, and outlook. Private balconies are provided to 90% of units, with Juliette balconies to the remaining units. A communal roof terrace (280 sqm) on the podium level provides shared amenity space with seating, planting, and views across the city.

The scheme achieves exceptional environmental performance, targeting BREEAM Excellent and net zero carbon in operation. Air source heat pumps will serve all apartments, with PV panels on roof areas generating renewable energy. The development includes 573 cycle parking spaces (2 per unit), supporting Manchester's ambition to become a carbon-neutral city by 2038.`
      },
      {
        type: "Heritage Statement",
        title: "Heritage Impact Assessment",
        content: `A comprehensive heritage assessment has been undertaken in accordance with Historic England guidance and the requirements of the National Planning Policy Framework (NPPF).

The application site lies within the Ancoats Conservation Area (designated 1989), which is recognised as an area of special architectural and historic interest due to its concentration of early industrial buildings. The site adjoins the Grade II Listed Murrays' Mills complex to the east, one of the finest examples of early cotton spinning mills in the world.

The existing building on the application site dates from circa 1965 and is a utilitarian industrial structure with no architectural merit. It is not identified as a positive contributor to the Conservation Area in the Ancoats Conservation Area Appraisal and makes no positive contribution to the setting of Murrays' Mills. The building's demolition will result in no harm to heritage significance.

The proposed development has been designed to preserve and enhance the character of the Conservation Area and the setting of Murrays' Mills. The use of high-quality red brick references the materiality of historic industrial buildings, while the building's massing and proportions respond to the scale and rhythm of the mill complexes. A 15m separation distance is maintained between the new development and Murrays' Mills, preserving spatial relationships and ensuring the Listed Building remains legible as a distinct element in the townscape.

The development will enhance views along Great Ancoats Street by replacing a utilitarian structure with a building of high architectural quality. The active ground floor frontage will support the vitality of the area and enhance the public realm, contributing positively to the ongoing regeneration of Ancoats. No harm to the significance of the Conservation Area or the setting of Murrays' Mills has been identified, and the proposal represents heritage-led regeneration in accordance with NPPF paragraphs 197-208.`
      },
      {
        type: "Transport Statement",
        title: "Transport Assessment",
        content: `The Transport Assessment examines the transport and highways impacts of 286 residential apartments in a highly accessible inner-city location.

The site benefits from exceptional public transport connectivity, with Manchester Piccadilly railway station 900m to the south and New Islington tram stop 400m to the north, providing frequent Metrolink services to the City Centre, MediaCityUK, and Manchester Airport. Numerous bus routes operate along Great Ancoats Street, with stops immediately adjacent to the site providing services across Greater Manchester.

The development adopts a low-car approach, with only 52 basement parking spaces provided (0.18 spaces per unit). This significantly below the Council's maximum standards and reflects the sustainable transport opportunities available. Parking is restricted to Blue Badge holders and car club vehicles, with a Car Club Management Strategy to be secured via Section 106 agreement. This approach supports Policy T1 and Manchester's ambition to deliver a 25% modal shift away from private car use by 2025.

Cycle parking provision significantly exceeds adopted standards, with 573 long-stay spaces (2 per unit) provided in secure basement stores accessed via lifts and dedicated cycle routes. An additional 29 short-stay spaces will be provided at ground level for visitors. The cycle stores will include facilities for adapted cycles and cargo bikes, Sheffield stands, and maintenance facilities including pumps and tools.

Trip generation modelling based on TRICS data predicts 28 two-way vehicle movements during the AM peak hour and 24 during the PM peak, representing a negligible impact on the highway network. A Construction Management Plan will be secured by condition to manage construction traffic and minimise disruption.

The development will contribute £286,000 (£1,000 per unit) toward sustainable transport improvements in the Ancoats area via Section 106 agreement, supporting enhancements to the Bee Network active travel infrastructure and improvements to Great Ancoats Street public realm.`
      }
    ],
    consultationResponses: [
      {
        respondent: "Transport for Greater Manchester",
        type: "support",
        summary: "No objection subject to cycle parking details and Section 106 contributions",
        fullText: "TfGM supports the low-car approach and has no objection subject to the submission of detailed cycle parking layouts and financial contributions toward the Bee Network..."
      },
      {
        respondent: "Historic England",
        type: "comment",
        summary: "No objection - development preserves setting of Murrays' Mills",
        fullText: "Historic England has reviewed the application and has no objection. The development has been carefully designed to respond to the Conservation Area context..."
      },
      {
        respondent: "Ancoats Residents Association",
        type: "object",
        summary: "Concern about height, density, and cumulative impact on local services",
        fullText: "Whilst we support regeneration of this brownfield site, we have significant concerns about the height of the towers at 22 storeys and the cumulative impact of multiple high-density schemes on local infrastructure..."
      }
    ]
  },
  {
    id: "manchester_2",
    reference: "134892/HH/2024",
    address: "67 Burton Road, West Didsbury, Manchester M20 2LN",
    applicationType: "Householder Application",
    description: "Two-storey side and rear extension, single-storey rear extension, and alterations to fenestration.",
    applicant: "Dr & Mrs Patel",
    siteBoundary: "M 298,598 L 302,598 L 302,602 L 298,602 Z",
    keyConstraints: [
      "Within Burton Road Conservation Area",
      "Semi-detached Edwardian house - non-designated heritage asset"
    ],
    applicablePolicies: [
      "DM1 - Development Management",
      "EN3 - Heritage",
      "Residential Design Guide SPD"
    ],
    documents: [
      {
        type: "Planning Statement",
        title: "Planning & Heritage Statement",
        content: `This application seeks planning permission for extensions and alterations to a semi-detached Edwardian house at 67 Burton Road, within the Burton Road Conservation Area.

The property is a typical Edwardian semi-detached house constructed circa 1905, with red brick elevations, rendered detailing, and a slate roof. While not statutorily listed, the property contributes positively to the character of the Burton Road Conservation Area through its architectural quality and historic interest.

The proposed works comprise: a two-storey side extension (3.2m wide) set back from the principal elevation; a two-storey rear extension (4m deep); a single-storey rear extension beyond the two-storey element; and replacement windows to the rear elevation.

The design approach prioritises the retention of the building's historic character and its contribution to the Conservation Area. The two-storey side extension has been carefully proportioned to maintain the visual separation between the pair of semi-detached houses, with a 500mm setback from the front building line and a lower ridge height (300mm below the main ridge). This ensures the extension appears subordinate and preserves the symmetrical rhythm of the original pair.

Materials will match the existing house in terms of brick type, bond, mortar colour, and roofing slates, ensuring a seamless integration. The rear extensions will not be visible from Burton Road and will have no impact on the streetscene or the character of the Conservation Area.

The works are necessary to provide additional living space for a growing family and will preserve and enhance the character of the Burton Road Conservation Area through high-quality design and traditional materials.`
      },
      {
        type: "Design & Access Statement",
        title: "Design Rationale",
        content: `The design has been developed in consultation with Manchester's Conservation Team and responds directly to the Burton Road Conservation Area Appraisal and adopted design guidance.

The two-storey side extension replicates the architectural detailing of the main house, including brick quoins at the corners, a corbelled eaves course, and rendered band course at first floor level. The ridge height is reduced by 300mm and the extension is set back 500mm from the front elevation, creating visual subservience and maintaining the legibility of the original building form.

The two-storey rear extension extends 4m beyond the original rear wall and maintains a width of 3.6m, leaving a 1m gap to the side boundary. Windows are positioned to align with the existing rear elevation fenestration, maintaining vertical emphasis and proportional relationships.

The single-storey element extends a further 3.5m and includes a flat sedum roof with minimal visual impact from neighbouring properties. Full-height glazing to the rear will provide a contemporary living space with direct access to the garden, while the north-facing side elevation will be brick to maintain privacy and respond to the site's constrained width.

All materials will be high quality and sympathetic to the host building: red facing brick to match existing in stretcher bond; natural slate roof covering; painted timber sash windows to the front and side; and slimline aluminium-framed glazing to the rear extension where it will not be visible from the street. The careful selection of materials and detailing will ensure the extensions enhance rather than harm the significance of the Conservation Area.`
      }
    ],
    consultationResponses: [
      {
        respondent: "Victorian Society (North West)",
        type: "comment",
        summary: "No objection subject to matching materials and retention of existing features",
        fullText: "The Victorian Society has reviewed the application and has no objection in principle, subject to the use of matching materials and the retention of all existing architectural details..."
      }
    ]
  }
];
