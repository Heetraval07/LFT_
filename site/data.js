import { runtime } from './runtime-data.js';

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
// Featured projects for the homepage, in homepage order (from the database).
export const recentProjectSlugs = runtime.featured || [];

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

// Published projects, in display order (from the database; managed in /admin).
export const projects = runtime.projects || [];

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
