const Hapi = require('@hapi/hapi')
const path = require('path')
const Blipp = require('blipp')
const yar = require('@hapi/yar')
const inert = require('@hapi/inert')
const vision = require('@hapi/vision')
const ejs = require('ejs')
const catboxMongo = require('catbox-mongodb')
const debug = require('debug')('defra.identity:demo:server')
const scpStub = require('defra-identity-app-scp-stub')
const defraIdentityHapiPlugin = require('@envage/defra-identity-hapi-plugin')
// const defraIdentityHapiPlugin = require('../defra-identity-hapi-plugin')

const registerServerAuth = require('./registerServerAuth')
const config = require('./config')

// Start the server
async function start () {
  const serverCache = config.mongoCache.enabled ? [
    {
      name: 'mongoCache',
      provider: {
        constructor: catboxMongo,
        options: {
          partition: 'idm-cache',
          host: config.mongoCache.connectionString ? undefined : config.mongoCache.host,
          uri: config.mongoCache.connectionString
        }
      }
    }
  ] : undefined

  const security = {
    xframe: 'deny',
    noSniff: true,
    hsts: {
      maxAge: 10454400,
      includeSubDomains: true,
      preload: true
    }
  }

  // Create a server with a host and port
  const server = Hapi.server({
    host: config.app.host,
    port: config.app.port,
    cache: serverCache,
    routes: {
      security: config.isSecure === true ? security : false,
      validate: {
        options: {
          abortEarly: false
        }
      }
    }
  })

  if (process.env.NODE_ENV === 'development') {
    await server.register({
      plugin: Blipp,
      options: {
        showAuth: true
      }
    })
  }

  /**
   *  Auth plugin registration
   **/
  let idmCache
  let passRequestToCacheMethods = false

  if (config.mongoCache.enabled) {
    idmCache = server.cache({
      cache: 'mongoCache',
      expiresIn: config.cache.ttlMs,
      segment: config.cache.segment
    })
  } else {
    await server.register({
      plugin: yar,
      options: {
        name: config.cache.segment,
        storeBlank: false,
        cookieOptions: {
          password: config.identity.cookiePassword,
          isSecure: config.isSecure,
          ttl: config.cache.ttlMs
        }
      }
    })

    passRequestToCacheMethods = true

    idmCache = {
      async get (key, request) {
        return request.yar.get(key)
      },
      async set (key, value, ttl, request) {
        return request.yar.set(key, value)
      },
      async drop (key, request) {
        return request.yar.clear(key)
      }
    }
  }

  const {
    app: {
      domain: appDomain
    },
    identity: {
      identityAppUrl,
      authRedirectUriFqdn,
      serviceId,
      cookiePassword,
      clientId,
      clientSecret,
      defaultPolicy,
      defaultJourney,
      aad,
      dynamics
    }
  } = config

  await server.register({
    plugin: defraIdentityHapiPlugin,
    options: {
      aad,
      dynamics,
      identityAppUrl,
      authRedirectUriFqdn,
      serviceId,
      cookiePassword,
      appDomain,
      clientId,
      clientSecret,
      defaultPolicy,
      defaultJourney,
      isSecure: config.isSecure,
      cache: idmCache,
      passRequestToCacheMethods,
      callbacks: {
        preLogout: async () => {
          console.log('User is logging out')
        },
        onError: async (err, request, h) => {
          // Insert your own error logging

          if (err) {
            console.error(err)
          }

          return h.view('error', {
            title: 'Woops, an error occurred',
            message: err.message
          })
        }
      }
    }
  })
  /** End auth plugin registration **/

  await server.register({
    plugin: scpStub,
    options: {
      config
    }
  })

  const staticFilePath = '/public/{param*}'

  // Refresh our token if it has expired
  server.ext('onPreAuth', async (request, h) => {
    // Don't check our credentials for requests for static files
    if (request.route.path !== staticFilePath) {
      const { idm } = request.server.methods

      const creds = await idm.getCredentials(request)

      if (creds && creds.isExpired()) {
        try {
          await idm.refreshToken(request)
        } catch (e) {
          console.error(e)
        }
      }
    }

    return h.continue
  })

  server.ext('onPreResponse', (request, h) => {
    const response = request.response

    if (response.isBoom || response instanceof Error) {
      debug(response)

      // return {
      //   ...response,
      //   message: response.message
      // }
    }

    return h.continue
  })

  // Static assets
  await server.register(inert)

  server.route(
    {
      method: 'GET',
      path: staticFilePath,
      handler: {
        directory: {
          path: path.join(__dirname, 'public')
        }
      }
    })

  await registerServerAuth(server)

  // All other routes
  server.route([
    ...require('./routes/root'),
    ...require('./routes/account'),
    ...require('./routes/enrolment'),
    ...require('./routes/status'),
    ...require('./routes/error')
  ])

  // Views
  await server.register(vision)

  server.views({
    engines: { ejs },
    relativeTo: __dirname,
    path: 'views'
  })

  await server.start()

  console.log('Server running at:', server.info.uri)

  return server
}

module.exports = start
