const debug = require('debug')('defra.identity:applicationInsights')

const { applicationInsights: aiConfig } = require('./config')

if (
  aiConfig.enabled &&
  aiConfig.instrumentationKey &&
  aiConfig.roleName
) {
  const applicationInsights = require('applicationInsights')
  applicationInsights
    .setup(aiConfig.instrumentationKey)
    // Use this for debugging. Outputs the internal logging to the console
    // .setInternalLogging(true, true)
    .start()

  // Use this for debugging. Sends requests off immediately without batching
  // applicationInsights.defaultClient.config.maxBatchSize = 1

  const cloudRole = applicationInsights.defaultClient.context.keys.cloudRole
  applicationInsights.defaultClient.context.tags[cloudRole] = aiConfig.roleName

  debug('Application insights registered with instrumentation key: ', aiConfig.instrumentationKey)
}
