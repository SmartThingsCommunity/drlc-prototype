const {SmartAppContext, Page} = require('@smartthings/smartapp');
const SERVER_URL = process.env.SERVER_URL;

/**
 * Second introductory page
 *
 * @param {SmartAppContext} context defines the configuration parameters and API for this installed instance
 * @param {Page} page object used to define page sections and settings
 */
module.exports = (context, page) => {
    page.section('heading', section => {
        section.paragraphSetting('automateText');
        section.imageSetting('automateImage').image(`${SERVER_URL}/images/automate.png`);
    });
    page.nextPageId('location');
    page.previousPageId('intro1');
};
