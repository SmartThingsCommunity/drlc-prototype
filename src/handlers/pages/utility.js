const {SmartAppContext, Page} = require('@smartthings/smartapp');
const nrel = require('../../nrel');
const db = require('../../db')

const SMARTTHINGS_REDIRECT_URI = 'https://api.smartthings.com/oauth/callback'
const ENERGY_SERVICE_URL = process.env.ENERGY_SERVICE_URL
const ENERGY_SERVICE_CLIENT_ID = process.env.ENERGY_SERVICE_CLIENT_ID

/**
 * Page for user to select their utility (if there's more than one) and configure thermostats for
 * demand response events.
 *
 * @param {SmartAppContext} context defines the configuration parameters and API for this installed instance
 * @param {Page} page object used to define page sections and settings
 * @returns {Promise<void>}
 */
module.exports = async (context, page) => {

    // Get the list of utilities for the specified zip code
    const utilities = (await nrel.getUtilities(context.configStringValue('zipCode'))).map(it => it.utility_name);

    // Render an enumeration setting for selecting the utility. Use the first utility as the default value
    // if there is more than one. Otherwise don't set a default so that user will know that one needs to be
    // selected.
    page.section('heading', (section) => {
        section.enumSetting('utility')
            .translateOptions(false)
            .options(utilities)
            .required(true)
            .defaultValue(utilities && utilities.length === 1 ? utilities[0] : undefined);
    });

    // Connect to the utility
    const credentials = await db.getCredentials(context.installedAppId)
    page.section('connect', section => {
        if (credentials) {
            section.paragraphSetting('disconnectInstructions');
            const url = `${ENERGY_SERVICE_URL}/disconnect?installedAppId=${context.installedAppId}`
            section.oauthSetting('disconnectLink').urlTemplate(url)

        } else {
            section.paragraphSetting('utilityInstructions');
            const url = `${ENERGY_SERVICE_URL}?installedAppId=${context.installedAppId}&utility=${encodeURIComponent(context.configStringValue('utility'))}`
            section.oauthSetting('link').urlTemplate(url)
        }
    });

    // Render settings for selection of thermostats and the configuration of demand response pre-cool
    // and event adjustment values.
    page.section('actions', (section) => {
        section.paragraphSetting('instructions');

        section.deviceSetting('thermostats')
            .capability('thermostatCoolingSetpoint')
            .permissions('rx')
            .multiple(true);

        section.numberSetting('preSetback')
            .defaultValue(2);

        section.numberSetting('eventSetback')
            .defaultValue(3);
    });

    page.previousPageId('location');
    page.complete(true);
};
