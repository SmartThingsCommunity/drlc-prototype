const axios = require('axios');
const db = require('../db')

const ENERSPONSE_SERVER_URL = process.env.ENERSPONSE_SERVER_URL;

/**
 * UNINSTALLED lifecycle event handler. Called when the app is removed by the user
 *
 * @param context defines the configuration parameters and API for this installed instance
 */
module.exports = async (context) => {

    // Call Enersponse to let them know that the instance has been uninstalled
    if (ENERSPONSE_SERVER_URL) {
        await axios.post(`${ENERSPONSE_SERVER_URL}/unregister`, {
            installedAppId: context.installedAppId
        });
    }

    // Clear the state record, if any, for this installation
    await db.clearState(context.installedAppId);
};
