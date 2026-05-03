import { prisma } from "@/lib/prisma";

type ProjectPublishLogsRouteContext = {
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
  context: ProjectPublishLogsRouteContext,
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

    const publishLogs = await prisma.notionPublishLog.findMany({
      where: {
        projectId,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      include: {
        spec: {
          select: {
            id: true,
            title: true,
            version: true,
          },
        },
      },
    });

    return Response.json({
      project,
      publishLogs,
    });
  } catch (error) {
    console.error("Failed to fetch publish logs.", error);

    return Response.json(
      { message: "Failed to fetch publish logs." },
      { status: 500 },
    );
  }
}
