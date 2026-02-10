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

// ✅ Правильная настройка обработчика ошибок валидации
fastify.setErrorHandler((error, request, reply) => {
  // Если это ошибка валидации Fastify
  if (error.validation) {
    const result: any = {
      errors: {}
    }

    for (const err of error.validation) {
      const field = err.instancePath.replace('/', '') || 'root'
      if (!result.errors[field]) result.errors[field] = []
      if (err.message) result.errors[field].push(err.message)
    }

    return reply.status(400).send({
      ...result,
      statusCode: 400,
      error: 'Validation Error'
    })
  }

  // Для других ошибок - стандартная обработка
  reply.send(error)
})

// ✅ CORS должен быть зарегистрирован ПЕРВЫМ (до всех плагинов и маршрутов)
fastify.register(cors, {
  origin: true, // Разрешает любой origin с поддержкой credentials
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ClientId', 'client-id'],
  exposedHeaders: ['Content-Type', 'Authorization', 'ClientId']
})

fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname,"../", "src", 'static'),
  prefix: '/static/',
})

const checkClientId = async (request: any, reply: any) => {
  const clientId = request.headers.clientid || request.headers['client-id'];
  
  if (!clientId) {
    return reply.status(400).send({
      error: 'Missing ClientId header',
      message: 'ClientID header is required for this request'
    });
  }
};

fastify.addHook('onRequest', checkClientId);

fastify.register(app)

fastify.listen({ port: 3000 })