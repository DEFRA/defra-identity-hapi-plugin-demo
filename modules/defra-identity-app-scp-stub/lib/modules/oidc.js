const { Provider } = require('oidc-provider')

/**
 * @type {{string: {email: string, timeout: number}}} sub and email key pairs
 */
const userStore = {}

/**
 * Temporarily store a sub and email in userStore
 *
 * @param {string} sub
 * @param {string }email
 */
const setInUserStore = (sub, email) => {
  if (userStore[sub]) {
    // If this user has logged in again, reset their timeout
    clearTimeout(userStore[sub].timeout)
  }

  userStore[sub] = {
    email,
    timeout: setTimeout(() => delete userStore[sub], 10 * 60 * 1000) // Remove after 10 minutes
  }

  return userStore[sub]
}

/**
 * @param {string} sub
 * @returns {{email: string, timeout: number}}
 */
const getFromUserStore = (sub) => {
  return userStore[sub]
}

module.exports = {
  initProvider: (options) => {
    const {
      app: { domain },
      scpStub: { stubPrefix, clientId, clientSecret, redirectUri }
    } = options.config

    const configuration = {
      routes: { // Define the routes as the same as scp
        userinfo: '/userinfo',
        authorization: '/authorize'
      },
      findAccount: async function (ctx, sub) {
        return {
          accountId: sub,
          scope: 'openid',
          use: 'userinfo',
          claims: (use, scope) => {
            switch (use) {
              case 'id_token': { // if the id_token is being retrieved
                return {
                  'bas:gg-legacy:registrationCategory': 'Individual',
                  'bas:groupId': sub,
                  'bas:idTokenVersion': '1.1',
                  'bas:roles': ['Administrator', 'User'],
                  'bas:token_identifier': sub,
                  acr: 'acr-gg-0',
                  groupProfile: `https://www.ete.access.service.gov.uk/groupprofile/${sub}`,
                  profile: `https://www.ete.access.service.gov.uk/profile/${sub}`,
                  scope,
                  sub
                }
              }
              case 'userinfo': { // If the userinfo is being retrieved
                const { email } = getFromUserStore(sub)

                return {
                  email,
                  email_verified: true,
                  name: email
                }
              }
              default: {
                return {}
              }
            }
          }
        }
      },
      claims: { // define the same claims that scp would return
        openid: [ // for the openid scope
          'acr',
          'bas:gg-legacy:registrationCategory',
          'bas:groupId',
          'bas:idTokenVersion',
          'bas:roles',
          'bas:token_identifier',
          'email',
          'email_verified',
          'groupProfile',
          'name',
          'profile',
          'scope',
          'sub'
        ]
      },
      features: {
        userinfo: { enabled: true },
        introspection: { enabled: true },
        revocation: { enabled: true },
        devInteractions: { enabled: false }
      },
      formats: {
        AccessToken: 'jwt'
      },
      clients: [{ // Define the credentials of the client set up in b2c
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uris: [redirectUri]
      }],
      interactions: {
        url: (ctx) => {
          return `${stubPrefix}/interaction/${ctx.oidc.uid}`
        }
      }
    }

    module.exports.provider = new Provider(domain, configuration)

    module.exports.provider.proxy = true
  },
  setInUserStore,
  getFromUserStore,
  provider: undefined
}
