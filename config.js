const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '.env') })

const { env } = process

module.exports = {
  app: {
    host: env.HOST || undefined, // Make sure it's undefined if not truey - heroku only wants to bind port
    port: env.PORT || 8000,
    domain: env.DOMAIN || `http://${env.HOST}:${env.PORT}`
  },
  identity: {
    identityAppUrl: env.IDENTITY_APP_URL,
    serviceId: env.IDENTITY_SERVICEID,
    authRedirectUriFqdn: env.IDENTITY_AUTHREDIRECTURIFQDN,
    cookiePassword: env.IDENTITY_COOKIEPASSWORD,
    clientId: env.IDENTITY_CLIENTID,
    clientSecret: env.IDENTITY_CLIENTSECRET,
    defaultPolicy: env.IDENTITY_DEFAULT_POLICY,
    defaultJourney: env.IDENTITY_DEFAULT_JOURNEY,
    aad: {
      authHost: env.AAD_AUTHHOST,
      tenantName: env.AAD_TENANTNAME
    },
    dynamics: {
      clientId: env.DYNAMICS_AADCLIENTID,
      clientSecret: env.DYNAMICS_AADCLIENTSECRET,
      resourceUrl: env.DYNAMICS_RESOURCEURL,
      endpointBase: env.DYNAMICS_ENDPOINTBASE
    }
  },
  serviceRoleId: env.IDENTITY_SERVICEROLEID,
  isSecure: env.IS_SECURE === 'true',
  cache: {
    ttlMs: 24 * 60 * 60 * 1000,
    segment: 'defra-identity-hapi-plugin-demo'
  },
  mongoCache: {
    enabled: env.USE_MONGODB === 'true',
    host: '127.0.0.1',
    connectionString: env.MONGO_CONNECTIONSTRING || undefined
  },
  basicAuth: {
    username: env.BASIC_USERNAME,
    password: env.BASIC_PASSWORD
  },
  scpStub: {
    enableScpStub: env.ENABLE_SCP_STUB === 'true',
    stubPrefix: '/scp-stub',
    redirectUri: `https://${env.SCP_STUB_B2C_TENANTNAME}.b2clogin.com/${env.SCP_STUB_B2C_TENANTID}/oauth2/authresp`,
    clientId: env.ENABLE_SCP_STUB === 'true' ? env.SCP_STUB_CLIENTID : undefined, // Ignore this value even if passed if stub is not enabled
    clientSecret: env.ENABLE_SCP_STUB === 'true' ? env.SCP_STUB_CLIENTSECRET : undefined // Ignore this value even if passed if stub is not enabled
  }
}
