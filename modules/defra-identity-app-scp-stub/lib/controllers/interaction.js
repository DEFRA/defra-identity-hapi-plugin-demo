const md5 = require('md5')

const oidc = require('../modules/oidc')

module.exports = {
  get: {
    handler: (request) => `
      <form method="post" style="
          text-align: center;
          padding-top: 25vh;
          font-family: Arial, sans-serif;
      ">
      <h1 style="font-size: 70px; margin-bottom: 30px;">Scp Stub</h1>
      <input type="hidden" name="crumb" value="${request.plugins.crumb}" />
      <input id="email" type="email" name="email" required autofocus style="font-size: 50px; margin-bottom: 30px;" placeholder="Email address">
      <br />
      <input id="submit" type="submit" style="font-size: 50px;">
      </form>`
  },
  post: {
    handler: async (request, h) => {
      const { email } = request.payload
      const sub = md5(email)

      oidc.setInUserStore(sub, email)

      const result = {
        login: {
          account: sub, // logged-in account id
          acr: 'acr-gg-0', // acr value for the authentication
          remember: false // true if provider should use a persistent cookie rather than a session one, defaults to true
        },
        consent: {}
      }

      const redirectTo = await oidc.provider.interactionResult(request.raw.req, request.raw.res, result)

      return h.redirect(redirectTo)
    }
  }
}
