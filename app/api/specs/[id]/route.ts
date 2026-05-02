import { Prisma } from "@prisma/client";
import {
  InvalidSpecFormatError,
  normalizePlanningSpec,
} from "@/lib/ai/specNormalizer";
import { prisma } from "@/lib/prisma";

type SpecRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateSpecPayload = {
  contentJson?: unknown;
};

const MOJIBAKE_MARKERS = ["ë", "ì", "í", "ê", "�"];

function parseSpecId(value: string) {
  const specId = Number(value);

  if (!Number.isInteger(specId) || specId <= 0) {
    return null;
  }

  return specId;
}

function containsMojibakeMarker(value: unknown): boolean {
  if (typeof value === "string") {
    return MOJIBAKE_MARKERS.some((marker) => value.includes(marker));
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsMojibakeMarker(item));
  }

  if (value && typeof value === "object") {
    return Object.values(value).some((item) => containsMojibakeMarker(item));
  }

  return false;
}

export async function GET(_request: Request, context: SpecRouteContext) {
  const { id } = await context.params;
  const specId = parseSpecId(id);

  if (specId === null) {
    return Response.json({ message: "Invalid spec id." }, { status: 400 });
  }

  try {
    const spec = await prisma.spec.findUnique({
      where: {
        id: specId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!spec) {
      return Response.json({ message: "Spec not found." }, { status: 404 });
    }

    return Response.json(spec);
  } catch (error) {
    console.error("Failed to fetch spec.", error);

    return Response.json(
      { message: "Failed to fetch spec." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: SpecRouteContext) {
  const { id } = await context.params;
  const specId = parseSpecId(id);

  if (specId === null) {
    return Response.json({ message: "Invalid spec id." }, { status: 400 });
  }

  let body: UpdateSpecPayload;

  try {
    body = (await request.json()) as UpdateSpecPayload;
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || body.contentJson === undefined) {
    return Response.json(
      { message: "Spec contentJson is required." },
      { status: 400 },
    );
  }

  let contentJson;

  try {
    contentJson = normalizePlanningSpec(body.contentJson);
  } catch (error) {
    if (error instanceof InvalidSpecFormatError) {
      return Response.json(
        { message: "Invalid spec contentJson." },
        { status: 400 },
      );
    }

    throw error;
  }

  if (containsMojibakeMarker(contentJson)) {
    return Response.json(
      { message: "Spec contentJson appears to contain mojibake text." },
      { status: 400 },
    );
  }

  try {
    const existingSpec = await prisma.spec.findUnique({
      where: {
        id: specId,
      },
      select: {
        id: true,
      },
    });

    if (!existingSpec) {
      return Response.json({ message: "Spec not found." }, { status: 404 });
    }

    const updatedSpec = await prisma.spec.update({
      where: {
        id: specId,
      },
      data: {
        title: contentJson.title || "PlanFlush MVP Planning Document",
        contentJson: contentJson as unknown as Prisma.InputJsonValue,
        status: "Draft",
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return Response.json(updatedSpec);
  } catch (error) {
    console.error("Failed to update spec.", error);

    return Response.json(
      { message: "Failed to update spec." },
      { status: 500 },
    );
  }
}
