import {join} from 'node:path'
import AutoLoad, {AutoloadPluginOptions} from '@fastify/autoload'
import {FastifyPluginAsync, FastifyServerOptions} from 'fastify'

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {

}

const options: AppOptions = {

}

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Register plugins
  fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts
  })

  // Register routes
  fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts,
    maxDepth: 10,
  })
}

export default app
export { app, options }
