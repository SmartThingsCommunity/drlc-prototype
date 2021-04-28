const axios = require('axios');
const db = require('../db')

const ENERGY_SERVICE_URL = process.env.ENERGY_SERVICE_URL;

/**
 * UNINSTALLED lifecycle event handler. Called when the app is removed by the user
 *
 * @param context defines the configuration parameters and API for this installed instance
 */
module.exports = async (context) => {

    // Call the energy service to let them know that the instance has been uninstalled
    if (ENERGY_SERVICE_URL) {
        await axios.post(`${ENERGY_SERVICE_URL}/unregister`, {
            installedAppId: context.installedAppId
        });
    }

    // Clear the state record, if any, for this installation
    await db.clearState(context.installedAppId);
};
