// Projects-page configuration. Projects themselves live in data.js.

// Filter tabs: the reference's categories, in its order.
export const projectTabs = [
  'All',
  'Beauty & Healthcare',
  'Commercial',
  'Downtown Lobby Renovations',
  'Entertainment',
  'F & B',
  'Retail Space',
];

// Which tab(s) each project belongs to (by slug). Projects not listed here appear under "All" only.
export const projectTags = {
  'dopamine-oasis-mall': ['Entertainment'],
  'eyewa-arabian-center': ['Retail Space'],
  'eyewa-masdar': ['Retail Space'],
  'eyewa-festival-plaza': ['Retail Space'],
  'eyewa-al-barsha': ['Retail Space'],
  'eyewa-ssmc': ['Retail Space', 'Beauty & Healthcare'], // eyewear store inside a medical city
  'jargee-deerfield': ['Retail Space'],
  'jargee-bawabat-al-sharq': ['Retail Space'],
};

// Older links use previous category names.
export const legacyCategory = { Kitchen: 'All', Bedroom: 'All', Residential: 'All' };

export const perPage = 12; // 3 columns x 4 rows, as in the reference

export const projectsIntro = {
  banner: { image: '/images/projects/eyewa-arabian-center/03.jpg', title: 'Our Projects' },
  heading: 'Completed Interior Design & Fit-Out Projects in the UAE',
  paragraphs: [
    'LFT Interior Design LLC delivers <b>interior fit-out projects</b> for retail, hospitality, food & beverage and entertainment brands across Dubai, Abu Dhabi and Sharjah, and beyond the UAE. Our services cover interior fit-out, ceiling and lighting solutions, carpentry and flooring, wallpaper fixing and full project management.',
    'Every project is coordinated by one team, so design intent, craftsmanship and delivery stay aligned from start to handover.',
  ],
  otherTitle: 'Other projects',
};
