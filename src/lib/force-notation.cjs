// Odd entries are the subscript; even entries stay ordinary text.
function splitForceLabels(text) {
  return text.split(/\bF_(\p{L}[\p{L}\p{M}\d]*)/gu);
}

module.exports = {splitForceLabels};
