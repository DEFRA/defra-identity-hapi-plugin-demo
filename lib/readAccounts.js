const got = require('got')

/**
 * Fetches all accounts for the given accountIds
 *
 * @param {Array} accountIds An array of accountIds
 * @param {Object} server
 * @return {Promise<Account[]>} An array of Accounts defined by the input array of Ids
 */
const readAccounts = async (accountIds = [], server, maxRecords = 50) => {
  const request = await readAccounts.buildRequest(accountIds, server, maxRecords)

  const res = await got(request)

  return readAccounts.parseResponse(res, server)
}

readAccounts.buildRequest = async (accountIds, server, maxRecords) => {
  const params = {
    $filter: `$top=${maxRecords}&`
  }

  if (accountIds.length) {
    params.$filter += ` ( ${accountIds.map(accountId => `accountid eq ${accountId}`).join(' or ')} ) `
  }

  const url = server.methods.idm.getInternals().dynamics.buildUrl('/accounts', params)
  const headers = await server.methods.idm.getInternals().dynamics.buildHeaders()

  return {
    method: 'GET',
    url,
    headers
  }
}

readAccounts.parseResponse = (res, server) => {
  const data = server.methods.idm.getInternals().dynamics.decodeResponse(res)

  if (!Array.isArray(data.value)) {
    throw new Error('readAccounts response has unrecognised JSON')
  }

  if (!data) {
    return
  }

  const links = data.value.map(link => {
    return {
      accountId: link.accountid,
      accountName: link.name
    }
  })

  return links
}

module.exports = readAccounts
