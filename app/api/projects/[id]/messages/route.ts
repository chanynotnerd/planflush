import { prisma } from "@/lib/prisma";

type ProjectMessagesRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CreateMessagePayload = {
  role?: unknown;
  content?: unknown;
};

const ALLOWED_MESSAGE_ROLES = new Set(["user", "assistant", "system"]);

function parseProjectId(value: string) {
  const projectId = Number(value);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return null;
  }

  return projectId;
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function projectExists(projectId: number) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
    },
  });

  return Boolean(project);
}

export async function GET(
  _request: Request,
  context: ProjectMessagesRouteContext,
) {
  const { id } = await context.params;
  const projectId = parseProjectId(id);

  if (projectId === null) {
    return Response.json({ message: "Invalid project id." }, { status: 400 });
  }

  try {
    const exists = await projectExists(projectId);

    if (!exists) {
      return Response.json({ message: "Project not found." }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return Response.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages.", error);

    return Response.json(
      { message: "Failed to fetch messages." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: ProjectMessagesRouteContext,
) {
  const { id } = await context.params;
  const projectId = parseProjectId(id);

  if (projectId === null) {
    return Response.json({ message: "Invalid project id." }, { status: 400 });
  }

  let body: CreateMessagePayload;

  try {
    body = (await request.json()) as CreateMessagePayload;
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const role = normalizeString(body?.role);
  const content = normalizeString(body?.content);

  if (!ALLOWED_MESSAGE_ROLES.has(role)) {
    return Response.json({ message: "Invalid message role." }, { status: 400 });
  }

  if (!content) {
    return Response.json(
      { message: "Message content is required." },
      { status: 400 },
    );
  }

  try {
    const exists = await projectExists(projectId);

    if (!exists) {
      return Response.json({ message: "Project not found." }, { status: 404 });
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          projectId,
          role,
          content,
        },
      }),
      prisma.project.update({
        where: {
          id: projectId,
        },
        data: {
          updatedAt: new Date(),
        },
      }),
    ]);

    return Response.json(message, { status: 201 });
  } catch (error) {
    console.error("Failed to create message.", error);

    return Response.json(
      { message: "Failed to create message." },
      { status: 500 },
    );
  }
}
