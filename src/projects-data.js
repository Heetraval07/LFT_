// Projects-page configuration. Projects themselves live in data.js.

// Filter tabs: the reference's categories, in its order. "Residential" is added at the end because
// most of LFT's existing projects are residential and fit none of the commercial categories.
export const projectTabs = [
  'All',
  'Beauty & Healthcare',
  'Commercial',
  'Downtown Lobby Renovations',
  'Entertainment',
  'F & B',
  'Retail Space',
  'Residential',
];

// Which tab(s) each project belongs to (by slug). Projects not listed here appear under "All" only.
export const projectTags = {
  'linden-house': ['Residential'],
  'harbour-apartment': ['Residential'],
  'walnut-loft': ['Residential'],
  'atelier-kitchen': ['Residential'],
  'quiet-suite': ['Residential'],
  'brick-and-fern': ['Residential'],
  'ridge-villa': ['Residential'],
  'indigo-flat': ['Residential'],
  'gallery-lounge': ['Commercial', 'Entertainment'],
};

// Older links (e.g. from the project detail page) use the previous category names.
export const legacyCategory = { Kitchen: 'Residential', Bedroom: 'Residential' };

export const perPage = 12; // 3 columns x 4 rows, as in the reference

export const projectsIntro = {
  banner: { image: '/images/1457842.jpg', title: 'Our Projects' },
  heading: 'Completed Interior Design & Fit-Out Projects in Dubai',
  paragraphs: [
    'LFT Interior Design LLC delivers <b>interior design and fit-out projects</b> for homes and commercial spaces. Our work covers space planning, concept development, kitchens, customised joinery and full project management, from the first sketch to handover.',
    'Every project is coordinated by one team, so design intent, craftsmanship and delivery stay aligned from start to finish.',
  ],
};
