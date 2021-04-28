const axios = require('axios');
const devices = require('../devices');
const ENERSPONSE_SERVER_URL = process.env.ENERSPONSE_SERVER_URL;

/**
 * UPDATED lifecycle event handler. Called when the app is initially installed (because there is no separate INSTALLED
 * handler) and whenever it is re-configured by the user. The handler calls Enersponse to let them know that a new
 * instance of the app has been installed and creates a device is one does not alread exist.
 *
 * @param context defines the configuration parameters and API for this installed instance
 * @returns {Promise<void>}
 */
module.exports = async (context) => {

    // re-configures the app, so it should be idempotent.
    if (ENERSPONSE_SERVER_URL) {
        await axios.post(`${ENERSPONSE_SERVER_URL}/register`, {
            installedAppId: context.installedAppId,
            zipCode: context.configStringValue('zipCode'),
            utility: context.configStringValue('utility')
        });
    }

    // Create a device if it doesn't already exist.
    const deviceId = await devices.getDeviceId(context);
    if (!deviceId) {
        await devices.createDevice(context);
    }
};
