import { prisma } from "@/lib/prisma";

type ProjectDetailRouteContext = {
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

export async function GET(
  _request: Request,
  context: ProjectDetailRouteContext,
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
    });

    if (!project) {
      return Response.json({ message: "Project not found." }, { status: 404 });
    }

    const latestSpec = await prisma.spec.findFirst({
      where: {
        projectId,
      },
      orderBy: [
        {
          version: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return Response.json({
      ...project,
      latestSpec,
    });
  } catch (error) {
    console.error("Failed to fetch project.", error);

    return Response.json(
      { message: "Failed to fetch project." },
      { status: 500 },
    );
  }
}
