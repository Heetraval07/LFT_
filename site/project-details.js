// Concept, Design Vision and key elements for the project detail page (stored per project in the database).
export function detailsFor(p) {
  return {
    concept: p.type || 'Interior Fit-Out',
    vision: p.vision || '',
    elements: p.elements || [],
    closing: `${p.title} reflects LFT Interior Design LLC's commitment to quality craftsmanship and to delivering every project in line with the client's brand identity.`,
  };
}
