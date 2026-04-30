import { Prisma } from "@prisma/client";
import { generatePlanningSpecFromMessages } from "@/lib/openai/generateSpec";
import { prisma } from "@/lib/prisma";

type GenerateSpecRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseProjectId(value: string) {
  const projectId = Number(value);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return null;
  }

  return projectId;
}

export async function POST(
  _request: Request,
  context: GenerateSpecRouteContext,
) {
  const { id } = await context.params;
  const projectId = parseProjectId(id);

  if (projectId === null) {
    return Response.json({ message: "Invalid project id." }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    if (!project) {
      return Response.json({ message: "Project not found." }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
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

    if (messages.length === 0) {
      return Response.json(
        { message: "At least one project message is required to generate a spec." },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { message: "OPENAI_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const planningSpec = await generatePlanningSpecFromMessages({
      apiKey,
      projectName: project.name,
      projectDescription: project.description,
      messages,
    });

    const latestSpec = await prisma.spec.findFirst({
      where: {
        projectId,
      },
      orderBy: {
        version: "desc",
      },
      select: {
        version: true,
      },
    });

    const spec = await prisma.spec.create({
      data: {
        projectId,
        title: planningSpec.title || "PlanFlush MVP Planning Document",
        contentJson: planningSpec as unknown as Prisma.InputJsonValue,
        status: "AI Draft",
        version: (latestSpec?.version ?? 0) + 1,
      },
    });

    return Response.json(spec, { status: 201 });
  } catch (error) {
    console.error("Failed to generate spec.", error);

    return Response.json(
      { message: "Failed to generate spec." },
      { status: 500 },
    );
  }
}
