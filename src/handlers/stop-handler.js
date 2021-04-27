const db = require('../db');
const devices = require('../devices');

/**
 * TIMER_EVENT handler executed at the end of the demand response event
 *
 * @param context defines the configuration parameters and API for this installed instance
 * @param event
 * @returns {Promise<void>}
 */
module.exports = async (context, event) => {

    // Update the status of the control indicator
    await devices.updateStatus(context, 'inactive');

    // Return the thermostat cooling setpoints to their original value before the DRLC event
    if ((await devices.demandResponseMode(context)) === 'enabled') {
        await devices.adjustThermostatSetpoints(context)
    }

    // Remove subscriptions
    await context.api.subscriptions.delete();

    // Clear the saved state, if any
    await db.clearState(context.installedAppId);
};
