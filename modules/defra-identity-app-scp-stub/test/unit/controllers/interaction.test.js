const md5 = require('md5')
const uuid = require('uuid/v4')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const td = require('testdouble')

describe('scp-stub - controllers - interaction', () => {
  let mock, passed, outcome, controller

  afterEach(td.reset)

  beforeEach(() => {
    passed = {
      setInUserStore: {
        sub: undefined,
        email: undefined
      },
      interactionResult: {
        req: undefined,
        res: undefined,
        result: undefined
      }
    }

    mock = {
      request: {
        payload: {
          email: uuid()
        },
        raw: {
          req: Symbol('raw req'),
          res: Symbol('raw res')
        }
      },
      h: {
        redirect: path => path
      },
      interactionResultResponse: Symbol('interaction finished'),
      modules: {
        oidc: {
          setInUserStore: (sub, email) => {
            passed.setInUserStore.sub = sub
            passed.setInUserStore.email = email
          },
          provider: {
            interactionResult: (req, res, result) => {
              passed.interactionResult.req = req
              passed.interactionResult.res = res
              passed.interactionResult.result = result

              return mock.interactionResultResponse
            }
          }
        }
      }
    }

    td.replace('../../../lib/modules/oidc', mock.modules.oidc)

    controller = require('../../../lib/controllers/interaction')
  })

  describe('when the get handler is invoked', () => {
    it('should return a string', () => {
      outcome = controller.get.handler({ plugins: { crumb: '' } })

      expect(outcome).to.be.a.string()
    })
  })

  describe('when the post handler is invoked', () => {
    beforeEach(async () => {
      outcome = await controller.post.handler(mock.request, mock.h)
    })

    it('should set the sub and user in the user store', () => expect(passed.setInUserStore).to.equal({
      sub: md5(mock.request.payload.email),
      email: mock.request.payload.email
    }))

    it('should return the interaction finished outcome', () => {
      expect(passed.interactionResult.req).to.equal(mock.request.raw.req)
      expect(passed.interactionResult.res).to.equal(mock.request.raw.res)
      expect(passed.interactionResult.result).to.equal({
        login: {
          account: md5(mock.request.payload.email),
          acr: 'acr-gg-0',
          remember: false
        },
        consent: {}
      })
    })
  })
})
