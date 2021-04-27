const {SmartAppContext, Page} = require('@smartthings/smartapp');
const SERVER_URL = process.env.SERVER_URL;

/**
 * First introductory page
 *
 * @param {SmartAppContext} context defines the configuration parameters and API for this installed instance
 * @param {Page} page object used to define page sections and settings
 */
module.exports = (context, page) => {
    page.section('heading', section => {
        section.paragraphSetting('demandText');
        section.imageSetting('demandImage').image(`${SERVER_URL}/images/demand.png`);
        section.paragraphSetting('demandText2');
    });
    page.nextPageId('intro2');
};
