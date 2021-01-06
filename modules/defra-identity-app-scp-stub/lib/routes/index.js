const anyController = require('../controllers/all')
const interactionController = require('../controllers/interaction')

module.exports = (options) => {
  const prefix = options.config.scpStub.stubPrefix

  return [
    {
      path: `${prefix}/interaction/{uid}`,
      method: 'GET',
      handler: interactionController.get.handler
    },
    {
      path: `${prefix}/interaction/{uid}`,
      method: 'POST',
      handler: interactionController.post.handler
    },
    {
      path: `${prefix}/{any*}`,
      method: '*',
      config: {
        auth: false,
        payload: {
          output: 'stream',
          parse: false
        }
      },
      handler: anyController(prefix).any.handler
    }
  ]
}
