const winston = require('winston')
const appInsights = require('applicationinsights')
const { AzureApplicationInsightsLogger } = require('winston-azure-application-insights')

const logger = winston.createLogger({
  level: 'debug',
  exitOnError: false,
  format: winston.format.json(),
  defaultMeta: { service: 'idm- demo' }
})

if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY != null) {
  const cloudRoleName = process.env.APPINSIGHTS_CLOUDROLENAME || 'IDM Demo'
  appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
    .setAutoDependencyCorrelation(true)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true)
    .setUseDiskRetryCaching(true)
  appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = cloudRoleName
  appInsights.start()
  winston.level = 'info'
  winston.exitOnError = false
  winston.add(new AzureApplicationInsightsLogger({
    insights: appInsights,
    level: 'error'
  }))
  winston.add(new winston.transports.Console({
    format: winston.format.simple(),
    level: 'info'
  }))
} else {
  winston.level = 'debug'
  winston.exitOnError = false
  winston.add(new winston.transports.Console({ format: winston.format.simple() }))
}

process.on('uncaughtException', (e) => {
  console.log(e)
  logger.error('error', e)
  setTimeout(function () { process.exit(1) }, 1000)
})

const server = require('./server')

server().catch(e => console.error(e))
