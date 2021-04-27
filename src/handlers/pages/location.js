const {SmartAppContext, Page} = require('@smartthings/smartapp');

/**
 * Page for entry of the user's zip code
 *
 * @param {SmartAppContext} context defines the configuration parameters and API for this installed instance
 * @param {Page} page object used to define page sections and settings
 */
module.exports = (context, page) => {
    page.section('heading', section => {
        section.textSetting('zipCode');
    });
    page.nextPageId('utility');
    page.previousPageId('intro2');
};
