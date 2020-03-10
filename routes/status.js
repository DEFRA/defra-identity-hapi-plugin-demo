const serviceLookup = require('../lib/services')
const EnrolmentStatus = require('../lib/EnrolmentStatus')

/**
 * GUID
 * @typedef {string} GUID A globally unique identifier
 */

module.exports = [
  {
    method: 'GET',
    path: '/status/{journey}',
    options: {
      auth: 'idm'
    },
    handler: async (request, h) => {
      const { idm } = request.server.methods
      const claims = await idm.getClaims(request)
      if (!claims) {
        return h.redirect('/error')
      }
      const { contactId } = claims
      const { journey } = request.params

      const currentEnrolments = await idm.dynamics.readEnrolment(contactId, null, null, null, null, true)
      // convert the enrolments into the data structure required by the data rows in the view
      const filteredEnrolments = currentEnrolments.value
        .map(thisEnrolment => new EnrolmentStatus(thisEnrolment))
        .filter(e => !e.isIdentity())
        .sort((a, b) => { // Sort by organisation / status
          return (a.accountName + '').toUpperCase() + a.status >= (b.accountName + '').toUpperCase() + b.status ? 1 : -1
        })

      return h.view('status', {
        title: 'Requests',
        idm,
        journeyName: serviceLookup[journey].serviceName,
        journey,
        filteredEnrolments,
        serviceLookup,
        claims: await idm.getClaims(request),
        credentials: await idm.getCredentials(request),
        trulyPrivate: false
      })
    }
  },
  {
    method: 'POST',
    path: '/status/{journey}',
    options: {
      auth: 'idm'
    },
    handler: async function (request, h) {
      const { journey } = request.params
      const { enrolmentStatusId, lobserviceUserLinkId } = request.payload
      const { idm } = request.server.methods
      await idm.dynamics.updateEnrolmentStatus(lobserviceUserLinkId, enrolmentStatusId)
      return h.redirect(`/status/${journey}`)
    }
  }
]
