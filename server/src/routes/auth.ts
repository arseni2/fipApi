import {FastifyPluginAsync, FastifyRequest, FastifyReply} from 'fastify'
import {z} from 'zod'
import {authService} from '../services/auth'
import {ZodTypeProvider} from "fastify-type-provider-zod";

// Define user type
interface User {
  id: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }
}

const signupSchema = z.object({
  email: z.email('Неверный формат email'),
  name: z
    .string()
    .min(1, 'Имя обязательно')
    .regex(/^[a-zA-Z]+$/, 'Имя должно содержать только латинские буквы'),
  password: z
    .string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .regex(/\d/, 'Пароль должен содержать хотя бы одну цифру')
    .regex(/[^a-zA-Z0-9]/, 'Пароль должен содержать хотя бы один спецсимвол'),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
})

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization

  if (!authHeader) {
    return reply.status(401).send({error: 'Unauthorized'})
  }

  try {
    request.user = authService.parseToken(authHeader)
  } catch {
    return reply.status(401).send({error: 'Invalid token'})
  }
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/auth/signup',
    {
      schema: {
        body: signupSchema,
      }
    },
    async (request, reply) => {
      const { email, password, name } = request.body;

      const errors = await authService.signUp(email, password, name);

      return errors ? reply.status(400).send({
        errors: errors.errors
      }) : reply.status(201).send({
        status: "OK"
      })
    }
  )

  fastify.withTypeProvider<ZodTypeProvider>().post(
    '/auth/signin',
    {
      schema: {
        body: loginSchema
      }
    },
    async (request, reply) => {
      const {email, password} = request.body
      const token = await authService.signIn(email, password)

      if (!token || !token.token) {
        return reply.status(400).send({
          errors: {
            email: ['Неправильный email или пароль']
          }
        })
      }
      return reply.send({token: token.token})
    }
  )

  fastify.withTypeProvider<ZodTypeProvider>().get(
    '/auth/me',
    {
      onRequest: [authenticate],
      schema: {
        response: {
          200: z.object({
            id: z.string()
          })
        }
      }
    },
    async (request: any, reply) => {
      return reply.send({
        id: request.user.id
      })
    }
  )
}

export default authRoutes
