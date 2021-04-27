/**
 * CONFIGURATION/INITIALIZED lifecycle event handler.
 * Skips the introduction pages if the user already has installed the app.
 *
 * @param context  defines the configuration parameters and API for this installed instance
 * @param initialization the response object
 * @returns {Promise<void>}
 */
module.exports = (context, initialization) => {
    if (context.configStringValue('utility')) {
        initialization.firstPageId('location');
    }
};
