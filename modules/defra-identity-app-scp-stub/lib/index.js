/**
 * @memberof idm
 * @namespace scp-stub
 */

const routes = require('./routes')
const { name: moduleName } = require('../package.json')
const oidc = require('./modules/oidc')

module.exports = {
  plugin: {
    name: moduleName,
    register: async (server, options) => {
      // Register the routes
      if (options.config.scpStub.enableScpStub) {
        oidc.initProvider(options)

        server.route(routes(options))
      }
    }
  }
}
