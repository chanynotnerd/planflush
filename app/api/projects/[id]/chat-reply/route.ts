import { generateProjectChatReply } from "@/lib/openai/generateChatReply";
import { prisma } from "@/lib/prisma";

type ChatReplyRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ChatReplyPayload = {
  content?: unknown;
};

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

async function getProject(projectId: number) {
  return prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
  });
}

export async function POST(
  request: Request,
  context: ChatReplyRouteContext,
) {
  const { id } = await context.params;
  const projectId = parseProjectId(id);

  if (projectId === null) {
    return Response.json({ message: "Invalid project id." }, { status: 400 });
  }

  let body: ChatReplyPayload;

  try {
    body = (await request.json()) as ChatReplyPayload;
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const content = normalizeString(body?.content);

  if (!content) {
    return Response.json(
      { message: "Message content is required." },
      { status: 400 },
    );
  }

  try {
    const project = await getProject(projectId);

    if (!project) {
      return Response.json({ message: "Project not found." }, { status: 404 });
    }

    const [userMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          projectId,
          role: "user",
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

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          message: "OPENAI_API_KEY is not configured.",
          userMessage,
        },
        { status: 500 },
      );
    }

    const conversation = await prisma.message.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        role: true,
        content: true,
        createdAt: true,
      },
    });

    let assistantContent: string;

    try {
      assistantContent = await generateProjectChatReply({
        apiKey,
        projectName: project.name,
        projectDescription: project.description,
        messages: conversation,
      });
    } catch (error) {
      console.error("Failed to generate assistant reply.", error);

      return Response.json(
        {
          message: "Failed to generate assistant reply.",
          userMessage,
        },
        { status: 500 },
      );
    }

    const [assistantMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          projectId,
          role: "assistant",
          content: assistantContent,
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

    return Response.json(
      {
        userMessage,
        assistantMessage,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create chat reply.", error);

    return Response.json(
      { message: "Failed to create chat reply." },
      { status: 500 },
    );
  }
}
