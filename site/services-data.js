// All Services-page content lives here. Edit freely.

export const servicesPage = {
  title: 'Our Services',
  // From the LFT company profile (Nov 2026). `id` is the anchor on the page (the About page links to some of them);
  // `contact` pre-fills the enquiry form on the Contact page.
  items: [
    {
      id: 'design', title: 'Interior Design', contact: null,
      text: 'Comprehensive interior design services. Our dedicated design team is the heart and soul of our ideas and our uniqueness in the industry.',
    },
    {
      id: 'fit-out', title: 'Interior Fit-Out', contact: 'commercial',
      text: "We ensure seamless integration and flawless execution. Our team manages everything from start to finish, aligning the work with your brand's identity.",
    },
    {
      id: 'ceiling-lighting', title: 'Ceiling & Lighting Solutions', contact: null,
      text: 'Our team installs exquisite ceilings and captivating lighting solutions that create a perfect space design.',
    },
    {
      id: 'carpentry', title: 'Carpentry & Flooring', contact: 'kitchens',
      text: 'Craftsmanship meets innovation with our adept carpentry and flooring services. We create distinct spaces that stand out from the crowd.',
    },
    {
      id: 'wallpaper', title: 'Wallpaper Fixing', contact: null,
      text: 'We transform blank walls into canvases of elegance and style, with a wide selection of wallpaper designs and prints.',
    },
    {
      id: 'project-management', title: 'Project Management', contact: null,
      text: 'Our management team constantly works towards the successful outcome of our projects while staying within budget and delivering on schedule.',
    },
  ],
};

// DEMO PLACEHOLDERS — not real approvals. Replace with verified authority logos: { name, src: '/logos/x.png' }.
export const authoritiesBlock = {
  title: 'Licensed & Approved by UAE Authorities',
  demoNote: 'Placeholder logos — replace with LFT’s verified licences and approvals before publishing.',
  items: [
    { name: 'Authority 1' }, { name: 'Authority 2' }, { name: 'Authority 3' }, { name: 'Authority 4' },
    { name: 'Authority 5' }, { name: 'Authority 6' }, { name: 'Authority 7' },
  ],
};

export const faq = {
  title: 'Frequently Asked Questions',
  items: [
    {
      q: 'What types of projects do you take on?',
      a: 'Our completed projects include retail stores, restaurants and cafés, hospitality venues, salons and entertainment venues across Dubai, Abu Dhabi, Sharjah and Kuwait, as well as residential interiors.',
    },
    {
      q: 'Do you handle commercial fit-outs?',
      a: 'Yes. We plan, design and coordinate commercial fit-outs so the finished space supports your brand, your operations and your customers.',
    },
    {
      q: 'Can you design a complete villa interior?',
      a: 'Yes. For villas we cover space planning, concept development, materials, lighting, furniture and styling, working closely with you so the home reflects how you live.',
    },
    {
      q: 'Do you make custom joinery and furniture?',
      a: 'We design bespoke joinery and furniture for each project, from wardrobes and kitchens to reception desks and feature walls, and manage their production and installation.',
    },
    {
      q: 'What does a design consultation include?',
      a: 'We discuss your goals, space, preferences and budget, review the site or plans, and outline how we would approach the project. It is the easiest first step if you are still deciding.',
    },
    {
      q: 'How long does a project take?',
      a: 'Timelines depend on the size, complexity and lead times of the project. We share a clear schedule with the proposal, and keep you updated as work progresses.',
    },
    {
      q: 'How do you manage the project and contractors?',
      a: 'Our project managers cover integration, scope, time, cost, resources, design, procurement, quality, safety, risk, change and communication management, as well as environment, health and safety, so the project stays within budget and on schedule with one point of contact from start to handover.',
    },
    {
      q: 'How do I get started?',
      a: 'Call 04 282 9773, email info@lftinteriors.com or use the contact page. Tell us a little about your space and we will arrange a consultation.',
    },
  ],
};

export const highlights = [
  { text: 'Elevating Environments, Enriching Experiences. LFT Interior Design LLC delivers interior design and fit-out projects across the UAE.', tag: 'Interior Design Services in Dubai' },
  { text: 'From concept development to project management, one team stays with you from the first sketch to handover.', tag: 'From Design to Delivery' },
  { text: 'Customised furniture and joinery, made to suit the space and the people who use it.', tag: 'Bespoke Joinery & Furniture' },
];
