'use strict'

const qs = require('querystring')
const db = require('../db')

// Handler called after SmartThings receives the redirect from the energy providers site. If the energy provider
// integration is based on OAuth2 this handler would make a call to the API to redeem a code for access in refresh
// tokens. If the integration doesn't require such API calls, or if those calls use a service token, then code
// redemption isn't required. You might still use this method to store information received by the partner. In this
// prototype we just make note of the fact that connection to the utility was made
module.exports = async (context, event) => {
    const params = qs.parse(event.urlPath);
    if (params.action === 'connect') {
        db.putCredentials(params.installedAppId, {token: 'faketoken'})
    } else if (params.action === 'disconnect') {
        db.clearCredentials(params.installedAppId)
    }
}
