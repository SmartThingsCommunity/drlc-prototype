const axios = require('axios');
const api = 'https://developer.nrel.gov/api';
const apiKey = process.env.NREL_API_KEY;

/**
 * API to get list of utilities for a zip code. Uses the US National Renewable Energy Laboratory API as a
 * placeholder. To be replaced with a call to Enersponse
 */
module.exports = {
    getUtilities(zipCode) {
        return axios.get(`${api}/utility_rates/v3.json?api_key=${apiKey}&address=${zipCode}`)
            .then(response => {
                if (response.data.outputs) {
                    return response.data.outputs.utility_info;
                }
                return [];
            });
    }
};
