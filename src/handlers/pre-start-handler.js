const devices = require('../devices');

/**
 * TIMER_EVENT handler executed at the start of the demand response event when there was a pre-cool period.
 * Generates the demandResponseStatus event and reduces the cooling setpoints of selected thermostats
 * by the configured amount, to pre-cool the home prior to the demand response event.
 *
 * @param context defines the configuration parameters and API for this installed instance
 * @param event
 * @returns {Promise<void>}
 */
module.exports = async (context, event) => {

    // Update the status of the control indicator
    await devices.updateStatus(context, 'active');

    // Get the current mode of the control indicator device
    const drMode = await devices.demandResponseMode(context)

    // Use the configured setback if we are enabled
    const setback = drMode === 'enabled' ?
        (context.configNumberValue('eventSetback') || 0) : 0

    // Make the event in progress adjustment
    await devices.adjustThermostatSetpoints(context, setback);
};
