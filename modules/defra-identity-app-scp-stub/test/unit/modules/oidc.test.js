const uuid = require('uuid/v4')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const td = require('testdouble')

describe('scp-stub - modules - oidc', () => {
  let mock, passed, outcome, system

  afterEach(td.reset)

  beforeEach(() => {
    passed = {
      provider: {
        appDomain: undefined,
        config: undefined
      }
    }

    mock = {
      options: {
        config: {
          app: { domain: uuid() },
          scpStub: {
            stubPrefix: uuid(), clientId: uuid(), clientSecret: uuid(), redirectUri: uuid()
          }
        }
      },
      sub: uuid(),
      email: uuid(),
      modules: {
        oidcProvider: {
          Provider: class {
            constructor (appDomain, config) {
              passed.provider.appDomain = appDomain
              passed.provider.config = config
            }
          }
        }
      }
    }

    td.replace('oidc-provider', mock.modules.oidcProvider)

    system = require('../../../lib/modules/oidc')
  })

  describe('setInUserStore', () => {
    const Timeout = setTimeout(() => {}).constructor

    beforeEach(() => {
      outcome = system.setInUserStore(mock.sub, mock.email)
    })

    it('should return an object containing the user\'s email address', () => expect(outcome.email).to.equal(mock.email))
    it('should return an object containing a timeout', () => expect(outcome.timeout).to.be.an.instanceof(Timeout))
  })

  describe('getFromUserStore', () => {
    const Timeout = setTimeout(() => {}).constructor

    beforeEach(() => {
      system.setInUserStore(mock.sub, mock.email)

      outcome = system.getFromUserStore(mock.sub)
    })

    it('should return an object containing the user\'s email address', () => expect(outcome.email).to.equal(mock.email))
    it('should return an object containing a timeout', () => expect(outcome.timeout).to.be.an.instanceof(Timeout))
  })

  describe('provider', () => {
    beforeEach(() => {
      system.initProvider(mock.options)
    })
    it('should export an instance of Provider', () => expect(system.provider).to.be.an.instanceof(mock.modules.oidcProvider.Provider))
    it('should construct with the correct domain', () => expect(passed.provider.appDomain).to.equal(mock.options.config.app.domain))

    describe('should construct with config containing', () => {
      it('a routes object', () => expect(passed.provider.config.routes).to.be.include(['userinfo', 'authorization']))
      it('a findAccount function', () => expect(passed.provider.config.findAccount).to.be.a.function())
      it('an array defining what claims are supported', () => expect(passed.provider.config.claims.openid).to.be.an.array())
      it('an object configuring features of the oidc provider', () => expect(passed.provider.config.features).to.be.an.object())
      it('an object configuring the access token', () => expect(passed.provider.config.formats).to.be.an.object())
      it('an array containing the client details specified in the env vars', () => {
        expect(passed.provider.config.clients).to.be.an.array()
        expect(passed.provider.config.clients.length).to.equal(1)
        expect(passed.provider.config.clients[0].client_id).to.equal(mock.options.config.scpStub.clientId)
        expect(passed.provider.config.clients[0].client_secret).to.equal(mock.options.config.scpStub.clientSecret)
        expect(passed.provider.config.clients[0].redirect_uris).to.equal([mock.options.config.scpStub.redirectUri])
      })
      it('an interactions url function', () => expect(passed.provider.config.interactions.url).to.be.a.function())
    })
  })
})
