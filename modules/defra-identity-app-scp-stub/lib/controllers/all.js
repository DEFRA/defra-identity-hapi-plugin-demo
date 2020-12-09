const oidc = require('../modules/oidc')

module.exports = (prefix) => ({
  any: {
    handler: async ({ raw: { req, res } }, h) => {
      req.originalUrl = req.url
      req.url = req.url.replace(prefix, '')

      await new Promise((resolve) => {
        res.on('finish', resolve)
        oidc.provider.callback(req, res)
      })

      req.url = req.url.replace('/', prefix)
      delete req.originalUrl

      return res.finished ? h.abandon : h.continue
    }
  }
})
