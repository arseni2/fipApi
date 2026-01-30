import Fastify from "fastify";
import {serializerCompiler, validatorCompiler, ZodTypeProvider} from "fastify-type-provider-zod";
import app from "./app";
import cors from '@fastify/cors';
import path from "path";
import multipart from '@fastify/multipart';



const fastify = Fastify({ logger: true })
  .withTypeProvider<ZodTypeProvider>()

fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)

fastify.setSchemaErrorFormatter((errors) => {
  const result: any = {
    errors: {}
  }

  for (const err of errors) {
    const field = err.instancePath.replace('/', '') || 'root'

    if (!result.errors[field]) result.errors[field] = []
    if (err.message) result.errors[field].push(err.message)
  }

  return result
})
fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname,"../", "src", 'static'),
  prefix: '/static/', // optional: default '/'
  //constraints: { host: '*' }
})

fastify.register(app)

// Register CORS
fastify.register(cors, {
  origin: '*',
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ClientId'],
  exposedHeaders: ['Content-Type', 'Authorization', 'ClientId']
})

// Register WebSocket plugin - commented out to prevent connection issues
// import websocketPlugin from './plugins/websocket'
// fastify.register(websocketPlugin)

fastify.listen({ port: 3000 })
