// Content for the project detail pages (Concept, Design Vision, key elements).
// Sources: project names and locations from the LFT company profile (Nov 2026); design elements are what the
// project photographs show. The profile has no written project descriptions, so nothing here goes beyond that.
// To give one project its own text, add the same fields to `overrides` below, keyed by the project slug.

const byBrand = {
  Eyewa: {
    concept: 'Eyewear Retail',
    vision: (p) => `Each Eyewa store follows the brand's identity: teal and coral finishes, a feature ceiling with linear lighting and bright, open display walls. At ${p.location} this identity was adapted to the store's layout and shopfront, so customers can browse the full range easily.`,
    elements: [
      'Illuminated shopfront and brand signage',
      'Feature ceiling with linear lighting',
      'Wall-mounted display joinery for frames',
      'Central display units',
      'Integrated digital screens',
      'Finishes in the Eyewa colour palette',
    ],
  },
  Jargee: {
    concept: 'Retail Store',
    vision: (p) => `The Jargee store at ${p.location} is built around the brand's bold yellow identity, with a bright shopfront and well-lit shelving that puts the product range on display from the mall walkway.`,
    elements: [
      'Branded yellow shopfront and signage',
      'Linear ceiling lighting',
      'Full-height product display shelving',
      'Glass display cabinets',
      'Feature product display wall',
    ],
  },
  'Dopamine Land': {
    concept: 'Immersive Entertainment',
    vision: (p) => `Dopamine at ${p.location} is a sequence of themed rooms, each with its own colour, lighting and installation, so visitors move from one experience to the next.`,
    elements: [
      'Themed experience rooms',
      'Coloured and neon lighting',
      'Branded entrance tunnel',
      'Cloud ceiling feature',
      'Interactive installations',
      'Soft-play and seating areas',
    ],
  },
};

const overrides = {};

const fallback = { concept: 'Interior Fit-Out', vision: () => '', elements: [] };

export function detailsFor(p) {
  const base = byBrand[p.client] || fallback;
  const o = overrides[p.slug] || {};
  return {
    concept: o.concept || base.concept,
    vision: o.vision || base.vision(p),
    elements: o.elements || base.elements,
    closing: o.closing || `${p.title} reflects LFT Interior Design LLC's commitment to quality craftsmanship and to delivering every project in line with the client's brand identity.`,
  };
}
