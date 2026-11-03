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

// Stock photos are referenced by numeric Pexels id; LFT project photos by their path.
export const img = (id) => (typeof id === 'string' ? id : `/images/${id}.jpg`);

export const heroSlides = [
  { id: 1571460, caption: 'Living room interior' },
  { id: 3356416, caption: 'Dining space with timber panelling' },
  { id: 1648776, caption: 'Living room with feature wall' },
  { id: 276724, caption: 'Lounge interior' },
  { id: 6758788, caption: 'Hospitality lounge interior' },
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

// Slugs of the projects shown on the homepage gallery, in order. Add more slugs to extend it.
export const recentProjectSlugs = [
  'dopamine-oasis-mall', 'eyewa-arabian-center', 'jargee-deerfield',
  'eyewa-masdar', 'jargee-bawabat-al-sharq', 'eyewa-festival-plaza',
];

// Brands LFT has delivered projects for (company profile). Shown as names; to show a logo instead,
// add src: '/logos/brand.png' to an entry. Only use logo files the brand owner has approved.
export const partners = [
  { name: 'Eyewa' },
  { name: 'Jargee' },
  { name: 'Dopamine' },
  { name: 'Mott 32' },
  { name: 'Aigner' },
  { name: 'Charriol' },
  { name: 'House of Curry' },
  { name: 'Trafalgar' },
  { name: 'Organico' },
  { name: 'Urban Glow Salon' },
];

// LFT's completed projects. Photos: images/ from the LFT team (copied to public/images/projects/).
// Names and locations: LFT company profile (Nov 2026). Year and area are not in the profile, so they are left out.
export const projects = [
  {
    slug: 'dopamine-oasis-mall',
    title: 'Dopamine',
    client: 'Dopamine Land',
    category: 'Entertainment',
    location: 'Oasis Mall, Dubai',
    cover: '/images/projects/dopamine-oasis-mall/05.jpg',
    gallery: [
      '/images/projects/dopamine-oasis-mall/03.jpg',
      '/images/projects/dopamine-oasis-mall/01.jpg',
      '/images/projects/dopamine-oasis-mall/06.jpg',
      '/images/projects/dopamine-oasis-mall/08.jpg',
      '/images/projects/dopamine-oasis-mall/16.jpg',
      '/images/projects/dopamine-oasis-mall/12.jpg',
      '/images/projects/dopamine-oasis-mall/15.jpg',
      '/images/projects/dopamine-oasis-mall/13.jpg',
      '/images/projects/dopamine-oasis-mall/07.jpg',
      '/images/projects/dopamine-oasis-mall/14.jpg',
      '/images/projects/dopamine-oasis-mall/17.jpg',
      '/images/projects/dopamine-oasis-mall/02.jpg',
      '/images/projects/dopamine-oasis-mall/04.jpg',
      '/images/projects/dopamine-oasis-mall/10.jpg',
      '/images/projects/dopamine-oasis-mall/11.jpg',
    ],
    intro: 'Interior fit-out of Dopamine, an immersive experience venue at Oasis Mall, Dubai.',
    body: [
      'A sequence of themed rooms, each with its own lighting, finishes and installations, built and coordinated by the LFT team from start to handover.',
    ],
  },
  {
    slug: 'eyewa-arabian-center',
    title: 'Eyewa — Arabian Center',
    client: 'Eyewa',
    category: 'Retail Space',
    location: 'Arabian Center, Dubai',
    cover: '/images/projects/eyewa-arabian-center/02.jpg',
    gallery: [
      '/images/projects/eyewa-arabian-center/01.jpg',
      '/images/projects/eyewa-arabian-center/03.jpg',
      '/images/projects/eyewa-arabian-center/04.jpg',
      '/images/projects/eyewa-arabian-center/05.jpg',
      '/images/projects/eyewa-arabian-center/06.jpg',
      '/images/projects/eyewa-arabian-center/07.jpg',
      '/images/projects/eyewa-arabian-center/08.jpg',
      '/images/projects/eyewa-arabian-center/09.jpg',
      '/images/projects/eyewa-arabian-center/10.jpg',
    ],
    intro: 'Interior fit-out of the Eyewa eyewear store at Arabian Center, Dubai.',
    body: [
      'Feature ceiling and lighting, display joinery and finishes delivered in line with the Eyewa brand identity.',
    ],
  },
  {
    slug: 'eyewa-masdar',
    title: 'Eyewa — My City Centre Masdar',
    client: 'Eyewa',
    category: 'Retail Space',
    location: 'My City Centre Masdar, Abu Dhabi',
    cover: '/images/projects/eyewa-masdar/07.jpg',
    gallery: [
      '/images/projects/eyewa-masdar/01.jpg',
      '/images/projects/eyewa-masdar/09.jpg',
      '/images/projects/eyewa-masdar/11.jpg',
      '/images/projects/eyewa-masdar/04.jpg',
      '/images/projects/eyewa-masdar/02.jpg',
      '/images/projects/eyewa-masdar/03.jpg',
      '/images/projects/eyewa-masdar/05.jpg',
      '/images/projects/eyewa-masdar/06.jpg',
      '/images/projects/eyewa-masdar/08.jpg',
      '/images/projects/eyewa-masdar/10.jpg',
      '/images/projects/eyewa-masdar/13.jpg',
    ],
    intro: 'Interior fit-out of the Eyewa eyewear store at My City Centre Masdar, Abu Dhabi.',
    body: [
      'Feature ceiling and lighting, display joinery and finishes delivered in line with the Eyewa brand identity.',
    ],
  },
  {
    slug: 'jargee-deerfield',
    title: 'Jargee — Deerfield Mall',
    client: 'Jargee',
    category: 'Retail Space',
    location: 'Deerfield Mall, Dubai',
    cover: '/images/projects/jargee-deerfield/05.jpg',
    gallery: [
      '/images/projects/jargee-deerfield/01.jpg',
      '/images/projects/jargee-deerfield/08.jpg',
      '/images/projects/jargee-deerfield/02.jpg',
      '/images/projects/jargee-deerfield/03.jpg',
      '/images/projects/jargee-deerfield/04.jpg',
      '/images/projects/jargee-deerfield/06.jpg',
      '/images/projects/jargee-deerfield/07.jpg',
      '/images/projects/jargee-deerfield/09.jpg',
      '/images/projects/jargee-deerfield/10.jpg',
    ],
    intro: 'Interior fit-out of the Jargee store at Deerfield Mall.',
    body: [
      'Shopfront, ceiling and lighting, display joinery and finishes delivered in line with the Jargee brand identity.',
    ],
  },
  {
    slug: 'eyewa-festival-plaza',
    title: 'Eyewa — Festival Plaza',
    client: 'Eyewa',
    category: 'Retail Space',
    location: 'Festival Plaza, Dubai',
    cover: '/images/projects/eyewa-festival-plaza/03.jpg',
    gallery: [
      '/images/projects/eyewa-festival-plaza/01.jpg',
      '/images/projects/eyewa-festival-plaza/04.jpg',
      '/images/projects/eyewa-festival-plaza/05.jpg',
      '/images/projects/eyewa-festival-plaza/06.jpg',
      '/images/projects/eyewa-festival-plaza/02.jpg',
    ],
    intro: 'Interior fit-out of the Eyewa eyewear store at Festival Plaza, Dubai.',
    body: [
      'Feature ceiling and lighting, display joinery and finishes delivered in line with the Eyewa brand identity.',
    ],
  },
  {
    slug: 'jargee-bawabat-al-sharq',
    title: 'Jargee — Bawabat Al Sharq Mall',
    client: 'Jargee',
    category: 'Retail Space',
    location: 'Bawabat Al Sharq Mall, Abu Dhabi',
    cover: '/images/projects/jargee-bawabat-al-sharq/04.jpg',
    gallery: [
      '/images/projects/jargee-bawabat-al-sharq/01.jpg',
      '/images/projects/jargee-bawabat-al-sharq/02.jpg',
      '/images/projects/jargee-bawabat-al-sharq/03.jpg',
      '/images/projects/jargee-bawabat-al-sharq/05.jpg',
      '/images/projects/jargee-bawabat-al-sharq/06.jpg',
      '/images/projects/jargee-bawabat-al-sharq/07.jpg',
      '/images/projects/jargee-bawabat-al-sharq/08.jpg',
      '/images/projects/jargee-bawabat-al-sharq/09.jpg',
    ],
    intro: 'Interior fit-out of the Jargee store at Bawabat Al Sharq Mall, Abu Dhabi.',
    body: [
      'Shopfront, ceiling and lighting, display joinery and finishes delivered in line with the Jargee brand identity.',
    ],
  },
  {
    slug: 'eyewa-al-barsha',
    title: 'Eyewa — City Centre Al Barsha',
    client: 'Eyewa',
    category: 'Retail Space',
    location: 'City Centre Al Barsha, Dubai',
    cover: '/images/projects/eyewa-al-barsha/01.jpg',
    gallery: [
      '/images/projects/eyewa-al-barsha/04.jpg',
      '/images/projects/eyewa-al-barsha/05.jpg',
      '/images/projects/eyewa-al-barsha/06.jpg',
      '/images/projects/eyewa-al-barsha/07.jpg',
      '/images/projects/eyewa-al-barsha/02.jpg',
      '/images/projects/eyewa-al-barsha/03.jpg',
      '/images/projects/eyewa-al-barsha/08.jpg',
    ],
    intro: 'Interior fit-out of the Eyewa eyewear store at City Centre Al Barsha, Dubai.',
    body: [
      'Feature ceiling and lighting, display joinery and finishes delivered in line with the Eyewa brand identity.',
    ],
  },
  {
    slug: 'eyewa-ssmc',
    title: 'Eyewa — SSMC',
    client: 'Eyewa',
    category: 'Retail Space',
    location: 'Sheikh Shakhbout Medical City (SSMC), Abu Dhabi',
    cover: '/images/projects/eyewa-ssmc/05.jpg',
    gallery: [
      '/images/projects/eyewa-ssmc/02.jpg',
      '/images/projects/eyewa-ssmc/03.jpg',
      '/images/projects/eyewa-ssmc/04.jpg',
      '/images/projects/eyewa-ssmc/01.jpg',
    ],
    intro: 'Interior fit-out of the Eyewa eyewear store at Sheikh Shakhbout Medical City (SSMC), Abu Dhabi.',
    body: [
      'Feature ceiling and lighting, display joinery and finishes delivered in line with the Eyewa brand identity.',
    ],
  },
];

// Other projects listed in the company profile (no photos supplied yet).
export const otherProjects = [
  'Mott 32 — Five Hotel, Dubai',
  'House of Curry — JBR, Dubai',
  'House of Curry — Downtown, Dubai',
  'Aigner — Dubai; Yas Mall, Abu Dhabi; Mirdif City Centre, Dubai; Galleria Mall, Abu Dhabi',
  'ARGC Restaurant — Dubai',
  'Time Velly — Yas Mall, Abu Dhabi',
  'Charriol — Dubai Mall, Dubai',
  'Trafalgar — Kuwait',
  'Bawabat Al Sharq Mall — Abu Dhabi',
  'Next Level Restaurant — Dubai',
  'Homa Park Cafe — Sharjah',
  'Organico — JAFZA One, Dubai',
  'Saraka Podium — Expo 2020, Dubai',
  'Pit Stop — Dubai Mall, Dubai',
  'Ripples — Mega Mall, Sharjah',
  'Urban Glow Salon — Dubai',
  "L'Attar Bar à Parfums — DIFC, Dubai",
  'Jargee — Abu Dhabi Mall, Abu Dhabi',
];
