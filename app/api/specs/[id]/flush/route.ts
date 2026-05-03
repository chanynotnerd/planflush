import {
  InvalidSpecFormatError,
  normalizePlanningSpec,
} from "@/lib/ai/specNormalizer";
import { prisma } from "@/lib/prisma";
import { publishSpecToNotion } from "@/lib/notion/publishSpec";

type FlushRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function parseSpecId(value: string) {
  const specId = Number(value);

  if (!Number.isInteger(specId) || specId <= 0) {
    return null;
  }

  return specId;
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown Notion publishing error.";
}

async function createFailureLog({
  projectId,
  specId,
  errorMessage,
}: {
  projectId: number;
  specId: number;
  errorMessage: string;
}) {
  await prisma.notionPublishLog.create({
    data: {
      projectId,
      specId,
      publishStatus: "Failed",
      errorMessage,
    },
  });
}

export async function POST(_request: Request, context: FlushRouteContext) {
  const { id } = await context.params;
  const specId = parseSpecId(id);

  if (specId === null) {
    return Response.json({ message: "Invalid spec id." }, { status: 400 });
  }

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

  const notionApiKey = process.env.NOTION_API_KEY;

  if (!notionApiKey) {
    await createFailureLog({
      projectId: spec.projectId,
      specId: spec.id,
      errorMessage: "NOTION_API_KEY is not configured.",
    });

    return Response.json(
      { message: "NOTION_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const notionDatabaseId = process.env.NOTION_DATABASE_ID;

  if (!notionDatabaseId) {
    await createFailureLog({
      projectId: spec.projectId,
      specId: spec.id,
      errorMessage: "NOTION_DATABASE_ID is not configured.",
    });

    return Response.json(
      { message: "NOTION_DATABASE_ID is not configured." },
      { status: 500 },
    );
  }

  const notionParentPageId = process.env.NOTION_PARENT_PAGE_ID;

  if (!notionParentPageId) {
    await createFailureLog({
      projectId: spec.projectId,
      specId: spec.id,
      errorMessage: "NOTION_PARENT_PAGE_ID is not configured.",
    });

    return Response.json(
      { message: "NOTION_PARENT_PAGE_ID is not configured." },
      { status: 500 },
    );
  }

  try {
    const specContent = normalizePlanningSpec(spec.contentJson);
    const publishedPage = await publishSpecToNotion({
      apiKey: notionApiKey,
      databaseId: notionDatabaseId,
      parentPageId: notionParentPageId,
      projectName: spec.project.name,
      specTitle: spec.title,
      specVersion: spec.version,
      specContent,
    });

    await prisma.$transaction([
      prisma.spec.update({
        where: {
          id: spec.id,
        },
        data: {
          status: "Published",
        },
      }),
      prisma.notionPublishLog.create({
        data: {
          projectId: spec.projectId,
          specId: spec.id,
          notionPageId: publishedPage.notionPageId,
          notionUrl: publishedPage.notionPageUrl,
          publishStatus: "Success",
          publishedAt: new Date(),
        },
      }),
    ]);

    return Response.json({
      message: "Notion 배포가 완료되었습니다.",
      notionPageId: publishedPage.notionPageId,
      notionPageUrl: publishedPage.notionPageUrl,
    });
  } catch (error) {
    if (error instanceof InvalidSpecFormatError) {
      await createFailureLog({
        projectId: spec.projectId,
        specId: spec.id,
        errorMessage: "Spec contentJson is invalid.",
      });

      return Response.json(
        { message: "Invalid spec contentJson." },
        { status: 400 },
      );
    }

    const errorMessage = getSafeErrorMessage(error);

    console.error("Failed to publish spec to Notion.", errorMessage);

    await createFailureLog({
      projectId: spec.projectId,
      specId: spec.id,
      errorMessage,
    });

    return Response.json(
      { message: "Notion 배포에 실패했습니다." },
      { status: 500 },
    );
  }
}
