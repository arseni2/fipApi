import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { dashboardService } from "../services/dashboard";
import { authenticate } from "./auth";
import { DashboardSchema } from "../db/dashboard/repo";
import { usersRepo } from "../db/users/repo";
import path from "path";
import * as fs from "node:fs/promises";

const createSchema = z.object({
  title: z.string().min(1, "Название обязательно"),
});

const likeSchema = z.object({
  id: z.string().min(1, "ID доски обязателен"),
});

const publicSchema = z.object({
  id: z.string().min(1, "ID доски обязателен"),
});

const shareSchema = z.object({
  id: z.string().min(1, "ID доски обязателен"),
  email: z.string().email("Неверный формат email"),
});

const sortSchema = z.object({
  sort: z.enum(["asc", "desc"]).default("desc"),
});

const updateBoardBodySchema = z.object({
  objects: z.array(z.any()), // JSON объекты доски
});

const dashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/dashboard/upload-image/upload",
    {
      onRequest: [authenticate],
      schema: {
        consumes: ["multipart/form-data"],
      },
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      try {
        const data = await request.file({
          limits: { fileSize: 5 * 1024 * 1024 },
        });

        if (!data) {
          return reply.status(400).send({ error: "No file uploaded" });
        }

        const { mimetype, file } = data;
        if (!mimetype?.startsWith("image/")) {
          return reply.status(400).send({ error: "File must be an image" });
        }

        // Extract and sanitize extension
        const ext =
          mimetype
            .split("/")[1]
            ?.split("+")[0]
            ?.replace(/[^a-z0-9]/gi, "") || "jpg";
        const filename = `${Date.now()}.${ext.toLowerCase()}`;

        // Adjust path: assuming static folder is at project root
        // If your structure is: /project/server/src/routes/... then:
        const staticDir = path.join(__dirname, "../", "../", "src", "static");
        console.log(staticDir);
        const filePath = path.join(staticDir, filename);

        // Ensure directory exists
        await fs.mkdir(staticDir, { recursive: true });

        // ✅ Universal way to read stream as buffer
        const chunks: Buffer[] = [];
        for await (const chunk of file) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        await fs.writeFile(filePath, buffer);

        return reply.send({ url: `http://127.0.0.1:3000/static/${filename}` });
      } catch (error) {
        console.error("Image upload error:", error);
        return reply.status(500).send({ error: "Failed to upload image" });
      }
    },
  );

  // 1. Создать доску
  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/dashboard/create",
    {
      onRequest: [authenticate],
      schema: {
        body: createSchema,
        response: {
          201: z.object({
            dashboard: DashboardSchema,
          }),
          401: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { title } = request.body;
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const dashboard = await dashboardService.create(title, request.user.id);
      return reply.status(201).send({ dashboard });
    },
  );

  // 2. Сделать доску публичной
  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/dashboard/make-public",
    {
      onRequest: [authenticate],
      schema: {
        body: publicSchema,
        response: {
          200: z.object({
            dashboard: DashboardSchema,
          }),
          401: z.object({
            error: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.body;
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      try {
        const dashboard = await dashboardService.makePublic(
          id,
          request.user.id,
        );
        return reply.send({ dashboard });
      } catch (e) {
        return reply.status(400).send({ error: e });
      }
    },
  );

  // 3. Поделиться доской с другим пользователем
  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/dashboard/share",
    {
      onRequest: [authenticate],
      schema: {
        body: shareSchema,
        response: {
          200: z.object({
            dashboard: DashboardSchema,
          }),
          401: z.object({
            error: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id, email } = request.body;
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const user = await usersRepo.findByEmail(email);
      if (!user) {
        return reply.status(404).send({ error: "Пользователь не найден" });
      }

      try {
        const dashboard = await dashboardService.share(
          id,
          request.user.id,
          user.id,
        );
        return reply.send({ dashboard });
      } catch (e) {
        return reply.status(400).send({ error: e });
      }
    },
  );

  // 4. Поставить лайк
  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/dashboard/like",
    {
      onRequest: [authenticate],
      schema: {
        body: likeSchema,
        response: {
          200: z.object({
            likes: z.number(),
          }),
          401: z.object({
            error: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.body;
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      try {
        const likes = await dashboardService.like(id, request.user.id);
        return reply.send({ likes });
      } catch (e) {
        return reply.status(400).send({ error: e });
      }
    },
  );

  // 5. Получить публичные доски
  fastify.withTypeProvider<ZodTypeProvider>().get(
    "/dashboard/public",
    {
      //onRequest: [authenticate],
      schema: {
        querystring: sortSchema,
        response: {
          200: z.object({
            dashboards: z.array(DashboardSchema),
          }),
          401: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      // if (!request.user) {
      //   return reply.status(401).send({ error: 'Unauthorized' });
      // }
      const { sort = "desc" } = request.query;
      const dashboards = await dashboardService.sortPublicByLike(sort);
      return reply.send({ dashboards });
    },
  );

  // 6. Получить редактируемые доски
  fastify.withTypeProvider<ZodTypeProvider>().get(
    "/dashboard/editable",
    {
      onRequest: [authenticate],
      schema: {
        response: {
          200: z.object({
            dashboards: z.array(DashboardSchema),
          }),
          401: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const dashboards = await dashboardService.getAllEditable(request.user.id);
      return reply.send({ dashboards });
    },
  );

  // 7. Получить конкретную доску по ID
  fastify.withTypeProvider<ZodTypeProvider>().get(
    "/dashboard/:id",
    {
      onRequest: [authenticate],
      schema: {
        params: z.object({
          id: z.string().min(1, "ID обязателен"),
        }),
        response: {
          200: DashboardSchema,
          401: z.object({
            error: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request: any, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const { id } = request.params;
      try {
        const dashboard = await dashboardService.getById(id, request.user.id);

        return reply.send(dashboard);
      } catch (e) {
        return reply.status(400).send({ error: e });
      }
    },
  );

  // 8. Обновить доску
  fastify.withTypeProvider<ZodTypeProvider>().put(
    "/dashboard/:id",
    {
      onRequest: [authenticate],
      schema: {
        params: z.object({
          id: z.string().min(1, "ID обязателен"),
        }),
        body: updateBoardBodySchema,
        response: {
          200: z.object({
            dashboard: DashboardSchema,
          }),
          401: z.object({
            error: z.string(),
          }),
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request: any, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }
      const { id } = request.params;
      const { objects } = request.body;

      try {
        const dashboard = await dashboardService.updateBoard(
          id,
          request.user.id,
          objects,
        );
        return reply.send({ dashboard });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Dashboard not found") {
            return reply.status(404).send({ error: "Dashboard not found" });
          } else if (error.message === "Access denied") {
            return reply.status(403).send({ error: "Access denied" });
          }
        }
        // For other errors, log and return a generic error
        console.error("Error updating dashboard:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  // 9. Получить публичную доску по hash (без авторизации)
  fastify.withTypeProvider<ZodTypeProvider>().get(
    "/board/:hash",
    {
      schema: {
        params: z.object({
          hash: z.string().min(1, "Hash обязателен"),
        }),
        response: {
          200: DashboardSchema,
          404: z.object({
            error: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { hash } = request.params;
      const dashboard = await dashboardService.findByPublicHash(hash);

      if (!dashboard) {
        return reply.status(404).send({ error: "Доска не найдена" });
      }

      return reply.send(dashboard);
    },
  );
};

export default dashboardRoutes;
