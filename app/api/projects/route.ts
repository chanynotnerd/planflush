import { prisma } from "@/lib/prisma";

type CreateProjectPayload = {
  name?: unknown;
  description?: unknown;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    });

    return Response.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects.", error);

    return Response.json(
      { message: "Failed to fetch projects." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: CreateProjectPayload;

  try {
    body = (await request.json()) as CreateProjectPayload;
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const name = normalizeString(body?.name);
  const description = normalizeString(body?.description);

  if (!name) {
    return Response.json(
      { message: "Project name is required." },
      { status: 400 },
    );
  }

  try {
    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
      },
    });

    return Response.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project.", error);

    return Response.json(
      { message: "Failed to create project." },
      { status: 500 },
    );
  }
}
