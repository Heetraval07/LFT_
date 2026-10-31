// All site content lives here. Change the brand details once and every page updates.

export const brand = {
  name: 'LFT Interior Design',
  legalName: 'LFT Interior Design LLC',
  tagline: 'Interior Design',
  established: 2019,
  email: 'info@lftinteriors.com',
  phone: '04 282 9773',
  phoneLink: '+97142829773', // used for tel: links (UAE country code + number)
  address: ['Ithraa Tower, Al Garhoud', 'Dubai, UAE'],
  mission:
    'Our mission at LFT Interior Design is to create thoughtfully designed spaces that balance functionality, comfort and aesthetics.',
  // PLACEHOLDER links to each platform's home page: replace each href with the studio's own profile URL.
  social: [
    { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/' },
    { label: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com/' },
    { label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/' },
  ],
};

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about.html' },
  { label: 'Our Services', href: '/services.html' },
  { label: 'Our Projects', href: '/projects.html' },
  { label: 'Contacts', href: '/contact.html' },
];

export const img = (id) => `/images/${id}.jpg`;

export const heroSlides = [
  { id: 1571460, caption: 'Linden House — Living' },
  { id: 3356416, caption: 'Dining space with timber panelling' },
  { id: 1648776, caption: 'Living room with feature wall' },
  { id: 276724, caption: 'Walnut Loft — Lounge' },
  { id: 6758788, caption: 'Gallery Lounge — Hospitality' },
];
export const HERO_INTERVAL_MS = 3000; // time each image is shown before the crossfade to the next

export const services = [
  {
    slug: 'residential',
    title: 'Residential Interiors',
    image: 1571453,
    summary: 'Complete homes shaped around how you actually live — from layout to the last cushion.',
    points: ['Space planning & layouts', 'Material and finish palettes', 'Custom joinery & furniture', 'Lighting design'],
  },
  {
    slug: 'commercial',
    title: 'Commercial & Hospitality',
    image: 2251247,
    summary: 'Workplaces, studios and lounges that carry a brand and work hard every day.',
    points: ['Brand-led concepts', 'Workplace planning', 'Hospitality lounges', 'Retail fit-outs'],
  },
  {
    slug: 'kitchens',
    title: 'Kitchens & Joinery',
    image: 2062426,
    summary: 'Kitchens, wardrobes and built-ins drawn to the millimetre and built to last.',
    points: ['Modular & bespoke kitchens', 'Wardrobes and storage', 'Vanities & bath joinery', 'Hardware selection'],
  },
  {
    slug: 'styling',
    title: 'Styling & Consultation',
    image: 1866149,
    summary: 'A lighter touch: a design direction, a furniture plan, or a room that finally feels finished.',
    points: ['Single-room styling', 'Furniture & art sourcing', 'Colour consultations', 'Design-direction sessions'],
  },
];

export const process = [
  { n: '01', title: 'Discover', text: 'We visit, measure and listen — your routines, your budget, the light at 4pm.' },
  { n: '02', title: 'Design', text: 'Layouts, mood boards and 3D views until every decision feels obvious.' },
  { n: '03', title: 'Detail', text: 'Drawings, specifications and samples. Nothing is left to guesswork on site.' },
  { n: '04', title: 'Deliver', text: 'We manage trades and installation, then style the space for move-in day.' },
];

export const stats = [
  { value: 140, suffix: '+', label: 'Spaces completed' },
  { value: new Date().getFullYear() - 2019, suffix: '', label: 'Years in practice' },
  { value: 98, suffix: '%', label: 'Clients who refer us' },
  { value: 30, suffix: '+', label: 'Trusted craftspeople' },
];

export const testimonials = [
  {
    quote: 'They understood the house before we did. Every room now has a reason to exist, and the light finally works for us.',
    name: 'Clara & Tom R.',
    project: 'Linden House',
  },
  {
    quote: 'Calm, organised and very precise. The kitchen was delivered on the week they promised, down to the drawer fronts.',
    name: 'Anika S.',
    project: 'Atelier Kitchen',
  },
  {
    quote: 'Our lounge went from a corridor with chairs to the place guests photograph. Bookings went up the month we reopened.',
    name: 'Marco D., Operations Lead',
    project: 'Gallery Lounge',
  },
];

// Slugs of the projects shown on the homepage gallery, in order. Add more slugs to extend it.
export const recentProjectSlugs = [
  'linden-house', 'harbour-apartment', 'walnut-loft',
  'atelier-kitchen', 'quiet-suite', 'brick-and-fern',
];

// PLACEHOLDER logos: fictional names, not real clients. Replace each entry with
// { name: 'Client', src: '/logos/client.svg' } (any image) to show a real logo.
export const partners = [
  { name: 'Northline Developments' },
  { name: 'Alder & Co.' },
  { name: 'Kestrel Hospitality' },
  { name: 'Orchard Row' },
  { name: 'Halden Studio' },
  { name: 'Fernhill Group' },
  { name: 'Stonebridge' },
  { name: 'Marlowe Estates' },
];

export const categories =['All', 'Residential', 'Kitchen', 'Bedroom', 'Commercial'];

export const projects = [
  {
    slug: 'linden-house',
    title: 'Linden House',
    category: 'Residential',
    location: 'Lake Oswego',
    year: 2025,
    area: '3,200 sq ft',
    cover: 1571460,
    gallery: [1571463, 1571458, 1669799],
    intro: 'A family home opened up around a floating stair, with soft neutrals and oak running from floor to ceiling.',
    body: [
      'The brief was simple: more light, fewer walls, and somewhere for everyone to be together without being on top of each other. We removed two partitions, rebuilt the stair as a sculptural element, and pulled the dining space toward the garden glazing.',
      'Materials stay quiet — limewashed walls, pale oak, bouclé and linen — so that the garden and the changing light do the work.',
    ],
  },
  {
    slug: 'harbour-apartment',
    title: 'Harbour Apartment',
    category: 'Residential',
    location: 'Seattle',
    year: 2024,
    area: '1,450 sq ft',
    cover: 1457842,
    gallery: [1643383, 1571468],
    intro: 'A compact waterfront apartment tuned to its view, in slate blues and soft greys.',
    body: [
      'Every piece of furniture was chosen to sit low so the water stays visible from the entrance. Storage is built into a continuous wall unit that doubles as the media console.',
      'A restrained palette of slate, chalk and smoked glass lets the harbour change the mood of the room through the day.',
    ],
  },
  {
    slug: 'walnut-loft',
    title: 'Walnut Loft',
    category: 'Residential',
    location: 'Portland',
    year: 2024,
    area: '2,100 sq ft',
    cover: 276724,
    gallery: [1648776, 1918291],
    intro: 'Warm walnut, low lighting and layered textiles turn an industrial loft into a place to slow down.',
    body: [
      'We wrapped the ceiling in a timber coffer to bring the scale down and hide new lighting. A central rug and sofa island anchors a room that previously had no centre.',
      'Library shelving runs the full length of one wall, giving the owners space for a collection that had lived in boxes for years.',
    ],
  },
  {
    slug: 'atelier-kitchen',
    title: 'Atelier Kitchen',
    category: 'Kitchen',
    location: 'Beaverton',
    year: 2025,
    area: '420 sq ft',
    cover: 2724749,
    gallery: [1080721, 2635038, 2062426],
    intro: 'A bright working kitchen built around a long island for cooking, homework and late conversations.',
    body: [
      'We redrew the room around a single 3.6 m island with seating on one side and prep on the other. Tall storage swallows appliances so the counters stay clear.',
      'Painted shaker fronts, honed quartz and brushed brass keep it classic; pendant lights mark the island without blocking sightlines.',
    ],
  },
  {
    slug: 'quiet-suite',
    title: 'The Quiet Suite',
    category: 'Bedroom',
    location: 'Vancouver, WA',
    year: 2023,
    area: '560 sq ft',
    cover: 6585757,
    gallery: [1743229, 6489083, 271624],
    intro: 'A primary suite designed for rest: stone, sheer linen and lighting that dims to almost nothing.',
    body: [
      'A stone-clad partition separates sleeping from dressing, and hides a run of wardrobes behind it. Sheer curtains on a ceiling track soften the large windows.',
      'Lighting is layered and low: concealed strips, a single pendant and reading lights you can turn off without getting up.',
    ],
  },
  {
    slug: 'brick-and-fern',
    title: 'Brick & Fern Residence',
    category: 'Residential',
    location: 'Portland',
    year: 2023,
    area: '1,800 sq ft',
    cover: 1918291,
    gallery: [3209045, 1129413],
    intro: 'Original brick, deep green upholstery and plenty of plants in a light-filled corner flat.',
    body: [
      'We stripped the plaster back to reveal the original brick and let it set the tone. Bay windows became a planted reading corner.',
      'Furniture mixes vintage finds with new pieces in deep teal and walnut, giving the home a collected rather than bought-at-once feel.',
    ],
  },
  {
    slug: 'gallery-lounge',
    title: 'Gallery Lounge',
    category: 'Commercial',
    location: 'Portland',
    year: 2025,
    area: '2,600 sq ft',
    cover: 6758788,
    gallery: [2251247, 1350789],
    intro: 'A members’ lounge with gallery lighting, dark oak and sculptural seating.',
    body: [
      'The client wanted a lounge that felt like a private gallery. Track lighting washes the walls, and furniture is arranged in small islands so conversations stay private.',
      'A timber screen wall divides bar and lounge while keeping both visible, and becomes the backdrop for rotating artwork.',
    ],
  },
  {
    slug: 'ridge-villa',
    title: 'Ridge Villa',
    category: 'Residential',
    location: 'Bend',
    year: 2024,
    area: '4,100 sq ft',
    cover: 7031406,
    gallery: [2121121, 1571453, 1457847],
    intro: 'A mountain home where cedar, stone and wide glazing bring the landscape inside.',
    body: [
      'Inside a strong modern shell we created warm, human-scale rooms: a dining area that opens to the deck, and a stair that becomes a gallery for the owners’ photography.',
      'Bathrooms are calm and minimal, in large-format porcelain with freestanding tubs facing the view.',
    ],
  },
  {
    slug: 'indigo-flat',
    title: 'Indigo Flat',
    category: 'Bedroom',
    location: 'Tacoma',
    year: 2023,
    area: '980 sq ft',
    cover: 3797991,
    gallery: [271816, 4846097],
    intro: 'Bold indigo walls and saffron accents for a young couple who wanted colour, not beige.',
    body: [
      'A panelled indigo feature wall carries the media unit and hides cables and storage. Saffron chairs and brass lighting keep the dark tone lively.',
      'In the bedroom and hall, deep blues continue with oak and velvet so the whole flat reads as one confident story.',
    ],
  },
];
