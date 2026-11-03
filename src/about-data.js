// All About-page content lives here. Company text comes from the LFT company profile (Nov 2026)
// unless marked as a placeholder.

export const aboutPage = {
  mission: 'Elevating Environments, Enriching Experiences. Transforming imagination into reality — your dreams brought to life by our expert team of designers and craftsmen.',
  image: { src: '/images/projects/eyewa-masdar/01.jpg', alt: 'Eyewa store at My City Centre Masdar, Abu Dhabi — fit-out by LFT' },
  kicker: 'About LFT Interior Design LLC',
  about: [
    'LFT Interior Design LLC is an interior design firm established in 2019, dedicated to transforming spaces into thoughtfully designed environments that balance functionality, comfort, and aesthetics.',
    "We offer comprehensive interior design solutions, including space planning, concept development, design consultancy, project management, and customised furniture design. Working across residential and commercial projects, we create interiors that reflect each client's individual requirements, preferences, and vision.",
    'Our team combines creative thinking with technical expertise and attention to detail to deliver spaces ranging from contemporary and minimalist designs to elegant and luxurious interiors. With a strong focus on quality, practicality, and refined design, we aim to create spaces that are both visually appealing and comfortable to experience.',
  ],
  whoWeAre: {
    title: 'Who We Are',
    text: [
      'Our experienced leadership team guides our vision for excellence. Our dedicated design team is the heart and soul of our ideas, our skilled craftsmen bring the designs to life with excellent execution, and our project managers guarantee efficient delivery from start to finish.',
      'Our client relations team ensures satisfaction with personalised attention while communicating seamlessly across departments.',
    ],
  },
  values: {
    title: 'Vision & Values',
    items: [
      ['Ego-less Teamwork', 'Collaboration is at our core. We believe in seamless integration between departments for the best results.'],
      ['Integrity and Professionalism', 'We believe in honesty, dedication and client satisfaction as the cornerstones of our conduct.'],
      ['Relentless Pursuit of Excellence', 'We continuously strive to surpass our achievements and bring you new levels of innovation.'],
      ['Growth and Profit', 'We aim for sustainable growth, enhancing profitability for all.'],
    ],
  },
  capabilities: {
    title: 'Our Capabilities',
    items: [
      'Skilled Interior Design and Space Planning',
      'Residential and Commercial Interior Solutions',
      'Customised Furniture and Joinery',
      'Project Management and Coordination',
      'Turnkey Interior Fit-Out Solutions',
    ],
  },
};

// DEMO PLACEHOLDERS — not real clients, partners or approvals.
// To use a real logo, add `src: '/logos/your-logo.png'` to an entry.
export const clientsPartners = {
  title: 'Our Clients & Partners',
  intro: 'We are proud to work with leading developers, brands, and industry partners.',
  approvedBy: [
    { name: 'Partner One' },
    { name: 'Partner Two' },
    { name: 'Partner Three' },
  ],
  registeredWith: [
    { name: 'Authority One' },
    { name: 'Authority Two' },
    { name: 'Authority Three' },
  ],
  closing: 'Our commitment to quality and compliance guides every project we deliver.',
  demoNote: 'Demo placeholders — to be replaced with LFT’s verified clients and partners.',
};

// DEMO PLACEHOLDERS — do not publish as real licences or approvals.
export const authorities = {
  title: 'Authorities & Approvals',
  intro: [
    'LFT Interior Design LLC aims to deliver every project in line with applicable local regulations, safety standards and industry practices.',
    'Our commitment to compliance means each project is planned, documented and delivered responsibly, safely and with the required approvals in place.',
  ],
  listTitle: 'Registered & Approved By:',
  items: [
    { name: 'Municipality', note: 'Compliance with building regulations and safety standards' },
    { name: 'Development Authority', note: 'Approvals for projects in free zones and designated areas' },
    { name: 'Civil Defence', note: 'Fire and life-safety requirements for commercial interiors' },
    { name: 'Utilities Authority', note: 'Coordination of MEP and utility connections' },
    { name: 'Trade Licence', note: 'Licence details to be added' },
  ],
  demoNote: 'Placeholder entries — replace with LFT’s verified licences, approvals and registrations.',
};

export const aboutServices = {
  title: 'Our Services',
  items: [
    {
      n: '01',
      title: 'Commercial Fit Out',
      text: 'We transform commercial spaces into dynamic environments that enhance brand identity, functionality, and customer experience. Our expertise spans offices, retail stores, restaurants, hotels, and other commercial spaces.',
      href: '/services.html#fit-out',
    },
    {
      n: '02',
      title: 'Villa Projects',
      text: 'We specialise in crafting bespoke villa interiors that combine luxury, functionality, and timeless elegance. Our team works closely with clients to create personalised living spaces.',
      href: '/services.html#design',
    },
    {
      n: '03',
      title: 'In-house Joinery',
      text: 'We provide high-quality customised joinery solutions, delivering bespoke craftsmanship that enhances the beauty and functionality of every space.',
      href: '/services.html#carpentry',
    },
  ],
};

// Parts: [text, style]  style: 'thin' (light grey) | 'bold' (white, underlined)
export const statement = [
  [['We meet new people ', 'thin'], ['every day,', 'bold']],
  [['coming with ', 'thin'], ['new dreams and hopes.', 'bold']],
  [['Our effort is to ', 'thin'], ['make them true.', 'bold']],
];

// DEMO PLACEHOLDERS — fictional names, not LFT clients.
// Brands LFT has delivered projects for (company profile). Shown as names; add src: '/logos/x.png'
// to an entry to show an approved logo file instead.
export const clients = {
  title: 'Our Clients',
  items: [
    { name: 'Eyewa', text: true },
    { name: 'Jargee', text: true },
    { name: 'Dopamine', text: true },
    { name: 'Mott 32', text: true },
    { name: 'Aigner', text: true },
    { name: 'Charriol', text: true },
    { name: 'House of Curry', text: true },
    { name: 'Trafalgar', text: true },
    { name: 'Organico', text: true },
    { name: 'Urban Glow Salon', text: true },
  ],
};

// Leadership (company profile). Hanif's profile text in the PDF duplicates Kishor's, so only his role is used here.
export const leadership = {
  title: 'Leadership Team',
  people: [
    { name: 'Rahul', role: 'Managing Director', bio: 'A seasoned business professional with over 24 years of experience, including 20 years in the UAE’s interior fit-out and MEP domain. A Mechanical Engineering graduate, Rahul has held project management and engineering roles at Fourth Wall Designs, Fix & Care Technical Services and other firms. Rahul is the owner of LFT Interior Design LLC.' },
    { name: 'Kishor K. Khedekar', role: 'Project Director', bio: 'Associated with reputed interior design studios in Dubai and Mumbai for 15 years and a graduate of L.S. Raheja School of Architecture. Kishor leads projects across their full lifecycle — concept design, costing, material selection, authority approvals, vendor coordination, execution and handover.' },
    { name: 'Hanif Vanu', role: 'Senior Designer', bio: 'Leads LFT’s design work, from concept to detailed drawings and material selection.' },
    { name: 'Rashid Khan', role: 'Accounts & Finance', bio: 'Over eight years of experience in finance and accounting, with a Master’s degree in Accounting from Bangalore University and previous experience as Finance Manager at a leading real estate company in Dubai.' },
  ],
  teamTitle: 'Our Team',
  team: [
    ['Mr. Rahul', 'Managing Director'], ['Mr. Kishor', 'Project Director'], ['Mr. Hanif', 'Senior Designer'], ['Mrs. Shraddha', 'Interior Designer'],
    ['Mr. Aman', 'Site In-charge'], ['Mr. Rashid', 'Chief Accountant'], ['Mrs. Maricris', 'Procurement'], ['Mrs. Zhina', 'Receptionist'],
  ],
};

export const reachUs = {
  title: 'Reach Us',
  mapQuery: 'Ithraa Tower, Al Garhoud, Dubai, UAE',
};

// SAMPLE TESTIMONIALS — AI-generated demo content. Fictional people; replace with genuine reviews.
export const sampleTestimonials = {
  label: 'Sample Testimonials – Demo Content',
  items: [
    {
      quote: 'The team listened carefully, explained every decision, and the finished apartment feels calm, practical and exactly like us.',
      name: 'Layla A.',
      project: 'Apartment interior (sample)',
    },
    {
      quote: 'Clear communication and tidy coordination from start to finish. The joinery details were noticeably well made.',
      name: 'Daniel R.',
      project: 'Office fit-out (sample)',
    },
    {
      quote: 'They balanced our budget and our wish list without cutting corners. We were handed a space that was ready to live in.',
      name: 'Meera S.',
      project: 'Villa refurbishment (sample)',
    },
  ],
};
