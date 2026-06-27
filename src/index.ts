import Fastify from 'fastify'
import cors from '@fastify/cors'
import { config } from './config/index.js'
import { TranslationService } from './services/translation.js'
import { LookupService } from './services/lookup.js'
import { translateRoute } from './routes/translate.js'
import { lookupRoute } from './routes/lookup.js'
import { languagesRoute } from './routes/languages.js'
import { healthRoute } from './routes/health.js'
import { failure } from './schemas/envelope.js'

export function buildApp(translationService?: TranslationService, lookupService?: LookupService) {
  const app = Fastify({ logger: true })

  app.register(cors, { origin: true })

  const translateSvc = translationService ?? TranslationService.create(config.geminiApiKey, config.geminiModel)
  const lookupSvc = lookupService ?? LookupService.create(config.geminiApiKey, config.geminiModel)

  app.register(async (instance) => {
    await healthRoute(instance)
    await languagesRoute(instance)
    await translateRoute(instance, translateSvc)
    await lookupRoute(instance, lookupSvc)
  }, { prefix: '/api/v1' })

  app.setErrorHandler((error: Error & { validation?: unknown }, _request, reply) => {
    app.log.error(error)
    if (error.validation) {
      return reply.status(400).send(failure('INVALID_INPUT', error.message))
    }
    return reply.status(500).send(failure('INTERNAL_ERROR', 'An unexpected error occurred.'))
  })

  return app
}

// Only start the server when run directly, not when imported by tests
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const app = buildApp()
  app.listen({ port: config.port, host: '0.0.0.0' }, (err) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
  })
}
