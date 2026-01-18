/**
 * Artillery processor functions
 * These can be used for dynamic data generation or request modifications
 */

/**
 * Generate a random barrel ID if needed
 * Currently unused but available for future use
 */
function generateRandomBarrelId(context, events, done) {
  // This could be used to randomly select from available barrels
  // For now, we'll leave it empty as the barrel is optional
  return done();
}

/**
 * Add custom metrics or logging if needed
 */
function addCustomMetrics(requestParams, context, events, done) {
  // Add any custom metrics here if needed
  return done();
}

module.exports = {
  generateRandomBarrelId,
  addCustomMetrics,
};
