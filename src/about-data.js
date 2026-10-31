// All About-page content lives here. Replace the placeholder items with LFT's verified information.

export const aboutPage = {
  mission:
    'At LFT Interior Design, we create thoughtfully designed spaces that balance functionality, comfort and aesthetics — from the first concept to the final detail.',
  image: { src: '/images/3356416.jpg', alt: 'Dining space with warm timber panelling and pendant lighting' },
  kicker: 'About LFT Interior Design LLC',
  about: [
    'LFT Interior Design LLC is an interior design firm established in 2019, dedicated to transforming spaces into thoughtfully designed environments that balance functionality, comfort, and aesthetics.',
    "We offer comprehensive interior design solutions, including space planning, concept development, design consultancy, project management, and customised furniture design. Working across residential and commercial projects, we create interiors that reflect each client's individual requirements, preferences, and vision.",
    'Our team combines creative thinking with technical expertise and attention to detail to deliver spaces ranging from contemporary and minimalist designs to elegant and luxurious interiors. With a strong focus on quality, practicality, and refined design, we aim to create spaces that are both visually appealing and comfortable to experience.',
  ],
  whoWeAre: {
    title: 'Who We Are',
    text: [
      'We are a team of designers and project specialists who believe a great interior starts with listening. Every project begins with understanding how a space will be used and how our clients want to feel in it.',
      'Creativity guides our concepts, while technical knowledge and careful detailing make them work in the real world. From the first sketch to the final finishing touch, we stay committed to delivering quality interiors that stand up to everyday life.',
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
      href: '/services.html#commercial',
    },
    {
      n: '02',
      title: 'Villa Projects',
      text: 'We specialise in crafting bespoke villa interiors that combine luxury, functionality, and timeless elegance. Our team works closely with clients to create personalised living spaces.',
      href: '/services.html#residential',
    },
    {
      n: '03',
      title: 'In-house Joinery',
      text: 'We provide high-quality customised joinery solutions, delivering bespoke craftsmanship that enhances the beauty and functionality of every space.',
      href: '/services.html#kitchens',
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
export const clients = {
  title: 'Our Clients',
  demoNote: 'Demo placeholders — to be replaced with LFT’s actual client logos.',
  items: [
    { name: 'Client One' },
    { name: 'Client Two' },
    { name: 'Client Three' },
    { name: 'Client Four' },
    { name: 'Client Five' },
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
