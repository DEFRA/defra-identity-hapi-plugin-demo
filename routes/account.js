const serviceLookup = require('../lib/services')
const connectionRoleIds = require('../lib/connectionRoleIds')

module.exports = [
  {
    method: 'GET',
    path: '/account/{journey}',
    options: {
      auth: 'basic-and-idm'
    },
    handler: async function (request, h) {
      const { journey } = request.params
      const { idm } = request.server.methods
      const claims = await idm.getClaims(request)
      if (!claims) {
        return h.redirect('/error')
      }
      const { contactId } = claims
      const serviceId = serviceLookup[journey].serviceId

      // read the connections for the current contact
      const rawConnections = await idm.dynamics.readContactsAccountLinks(contactId)
      // read the enrolments for the current contact within this service
      const [currentEnrolments] = await idm.dynamics.readEnrolment(contactId, null, null, null, serviceId, true)
      const rawEnrolments = currentEnrolments.value || []
      // convert the enrolments into the data structure required by the data rows in the view
      const enrolments = rawEnrolments.map((thisEnrolment) => {
        return {
          accountName: thisEnrolment['_defra_organisation_value@OData.Community.Display.V1.FormattedValue'],
          accountId: thisEnrolment._defra_organisation_value,
          enrolmentType: thisEnrolment['_defra_servicerole_value@OData.Community.Display.V1.FormattedValue'],
          serviceName: thisEnrolment['_defra_service_value@OData.Community.Display.V1.FormattedValue'],
          status: thisEnrolment['defra_enrolmentstatus@OData.Community.Display.V1.FormattedValue'],
          connectionType: ''
        }
      })
      // read the accounts associated with the connections
      const accountIds = rawConnections.map(conn => conn.accountId)
      const accounts = await idm.dynamics.readAccounts(accountIds, request.server)
      const accountNameFromId = accounts.reduce((acc, a) => ({ ...acc, [a.accountId]: a.accountName }), {})
      Object.assign(accountNameFromId, { null: 'Citizen' }) // Add a key for "null" which returns "Citizen"
      const services = []
      // create data structures for the view inluding placeholder rows for accounts for which we don't have an enrolment
      rawConnections.forEach((conn) => {
        const found = enrolments.find((e) => e.accountId === conn.accountId)
        if (found) {
          // Add the connection type
          found.connectionType = connectionRoleIds.byRoleId[conn.roleId]
          if (!found.accountName) {
            found.accountName = 'Citizen'
          }
          services.push(found)
        } else {
          services.push({
            accountName: accountNameFromId[conn.accountId],
            accountId: conn.accountId,
            enrolmentType: 'None',
            serviceName: 'None',
            status: 'Ready to enrol',
            connectionType: 'None'
          })
        }
      })
      // sort the services by status and name (we want active services at the top)
      services.sort((a, b) => {
        return a.status + (a.accountName + '').toUpperCase() >= b.status + (b.accountName + '').toUpperCase() ? 1 : -1
      })
      const identity = []
      return h.view('account', {
        title: 'account',
        user: null,
        idm,
        journeyName: serviceLookup[journey].serviceName,
        journey,
        services,
        identity,
        serviceLookup,
        claims: await idm.getClaims(request),
        credentials: await idm.getCredentials(request),
        trulyPrivate: false
      })
    }
  },
  {
    method: 'GET',
    path: '/account-private',
    options: {
      auth: 'basic-and-idm'
    },
    handler: async function (request, h) {
      const { idm } = request.server.methods

      return h.view('account', {
        title: 'account-private',
        user: null,
        idm,
        claims: await idm.getClaims(request),
        credentials: await idm.getCredentials(request),
        trulyPrivate: true
      })
    }
  }
]
