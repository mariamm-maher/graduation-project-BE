/**
 * Normalise brandTone from request body. Returns undefined if field not sent (no update).
 */
function normalizeBrandToneFromBody(body = {}) {
  const hasBrandTone =
    Object.prototype.hasOwnProperty.call(body, 'brandTone') ||
    Object.prototype.hasOwnProperty.call(body, 'brand_tone');

  if (!hasBrandTone) {
    return undefined;
  }

  let brandTone = body.brandTone || body.brand_tone || null;
  if (typeof brandTone === 'string') {
    try {
      brandTone = JSON.parse(brandTone);
    } catch {
      return null;
    }
  }
  if (!brandTone) {
    return null;
  }

  return {
    tone_formality: Number(brandTone.tone_formality) || 3,
    tone_playfulness: Number(brandTone.tone_playfulness) || 3,
    tone_boldness: Number(brandTone.tone_boldness) || 3,
    preferred_vocabulary: Array.isArray(brandTone.preferred_vocabulary)
      ? brandTone.preferred_vocabulary
      : [],
    avoided_vocabulary: Array.isArray(brandTone.avoided_vocabulary)
      ? brandTone.avoided_vocabulary
      : [],
  };
}

module.exports = { normalizeBrandToneFromBody };
