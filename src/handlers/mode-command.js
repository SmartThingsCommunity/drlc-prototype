const devices = require('../devices');

/**
 * DEVICE_COMMANDS_EVENT lifecyce event handler.
 * Receives demandResponseMode device commands and generates the corresponding events.
 *
 * @param context defines the configuration parameters and API for this installed instance
 * @param deviceId the ID of the device receiving the command
 * @param cmd the command being sent to the device
 * @returns {Promise<void>}
 */
module.exports = async (context, deviceId, cmd) => {

    // Update the value of the demandResponseMode attribute in the device
    await context.api.devices.createEvents(deviceId, [{
        component: cmd.componentId,
        capability: cmd.capability,
        attribute: 'mode',
        value: cmd.arguments[0]
    }]);

    // If we're in the middle of an event, make adjustments for the mode change
    const {value} = await devices.demandResponseStatus(context, deviceId);
    if (value !== 'inactive') {

        // Check the new mode
        if (cmd.arguments[0] === 'enabled') {
            // If we are now enabled, adjust the setpoints as configured
            if (value === 'pre') {
                await devices.adjustThermostatSetpoints(context, -context.configNumberValue('preSetback'));
            } else if (value === 'active') {
                await devices.adjustThermostatSetpoints(context, context.configNumberValue('eventSetback'));
            }
        } else {
            // If we are now disabled, return the setpoints to their values before the event started
            await devices.adjustThermostatSetpoints(context)
        }
    }
};
