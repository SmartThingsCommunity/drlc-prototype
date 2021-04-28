const axios = require('axios');
const devices = require('../devices');
const ENERGY_SERVICE_URL = process.env.ENERGY_SERVICE_URL;

/**
 * UPDATED lifecycle event handler. Called when the app is initially installed (because there is no separate INSTALLED
 * handler) and whenever it is re-configured by the user. The handler calls the utility service to let them know that a new
 * instance of the app has been installed and creates a device is one does not already exist.
 *
 * @param context defines the configuration parameters and API for this installed instance
 * @returns {Promise<void>}
 */
module.exports = async (context) => {

    // re-configures the app, so it should be idempotent.
    if (ENERGY_SERVICE_URL) {
        await axios.post(`${ENERGY_SERVICE_URL}/register`, {
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
