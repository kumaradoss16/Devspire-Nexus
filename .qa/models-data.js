/* Presentation adapter: maps the shared registry schema from
   data/ai-models.js into the field names this page's engine renders.
   Records live in the data file; none are embedded here. */
const MODELS_DATA = (Array.isArray(window.AI_MODELS) ? window.AI_MODELS : []).map((m) => ({
  id: m.id,
  name: m.name,
  publisher: m.publisher,
  icon: m.icon,
  cat: m.category,
  sub: m.source_category,
  family: m.family,
  pricing: m.pricing,
  signup: m.signup_required,
  local: m.self_hostable,
  weights: m.weights,
  license: m.license,
  licenseGroup: m.license_group,
  params: m.params,
  contextK: m.context_k,
  moe: m.moe,
  modalities: m.modalities,
  url: m.official_url,
  evidence: m.evidence,
  verified: m.verified,
  desc: m.description,
  notes: m.notes,
  tags: m.tags
}));



