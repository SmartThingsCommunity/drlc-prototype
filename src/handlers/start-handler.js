const devices = require('../devices');

/**
 * TIMER_EVENT handler executed at the start of the demand response event when there was no pre-cool period
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

    // Save the initial setpoints and make adjustments
    await devices.initializeThermostatSetpoints(context, setback);

    // Create subscriptions to the thermostats
    await context.api.subscriptions.delete();
    await context.api.subscriptions.subscribeToDevices(
        context.config.thermostats,
        'thermostatCoolingSetpoint',
        'coolingSetpoint',
        'thermostatHandler');
};
