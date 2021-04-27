const devices = require('../devices');

/**
 * TIMER_EVENT handler executed at the start of the pre cool/heat period.
 * Generates the demandResponseStatus event and reduces the cooling setpoints of selected thermostats
 * by the configured amount, to pre-cool the home prior to the demand response event.
 *
 * @param context defines the configuration parameters and API for this installed instance
 * @param event
 * @returns {Promise<void>}
 */
module.exports = async (context, event) => {

    // Update the status of the control indicator device
    await devices.updateStatus(context, 'pre');

    // Get the current mode of the control indicator device
    const drMode = await devices.demandResponseMode(context)

    // Use the configured setback if we are enabled
    const setback = drMode === 'enabled' ?
        (-context.configNumberValue('preSetback') || 0) : 0

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
