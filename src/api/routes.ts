import { parseCreateRunRequest, parseListRunsQuery } from "./dto.ts";
import type { ApiResponse, RouteDefinition } from "./types.ts";

export const routes: RouteDefinition[] = [
  {
    method: "GET",
    path: "/runs",
    handler: async (request, context): Promise<ApiResponse> => {
      const query = parseListRunsQuery(request.query);
      const runs = await context.services.runService.listRuns(query.status, query.limit);
      return { status: 200, body: { runs } };
    }
  },
  {
    method: "GET",
    path: "/runs/:id",
    handler: async (request, context): Promise<ApiResponse> => {
      const run = await context.services.runService.getRun(request.params?.id ?? "");
      if (!run) {
        return { status: 404, body: { error: "RunNotFound" } };
      }
      return { status: 200, body: { run } };
    }
  },
  {
    method: "POST",
    path: "/runs",
    handler: async (request, context): Promise<ApiResponse> => {
      const body = parseCreateRunRequest(request.body);
      const run = await context.services.runService.createRun(body);
      return { status: 201, body: { run } };
    }
  },
  {
    method: "POST",
    path: "/runs/:id/cancel",
    handler: async (request, context): Promise<ApiResponse> => {
      const run = await context.services.runService.cancelRun(request.params?.id ?? "");
      if (!run) {
        return { status: 404, body: { error: "RunNotFound" } };
      }
      return { status: 200, body: { run } };
    }
  },
  {
    method: "GET",
    path: "/runs/:id/artifacts/:filename",
    handler: async (request, context): Promise<ApiResponse> => {
      const runId = request.params?.id;
      const filename = request.params?.filename;
      if (!runId || !filename) {
        return { status: 400, body: { error: "MissingParameters" } };
      }
      const filePath = await context.services.artifactsService.getArtifactStream(runId, filename);
      if (!filePath) {
        return { status: 404, body: { error: "ArtifactNotFound" } };
      }
      return {
        status: 200,
        body: filePath,
        headers: {
          "Content-Type": context.services.artifactsService.getMimeType(filename),
          "Content-Disposition": `attachment; filename="${filename}"`
        }
      } as any; // Cast needed because our ApiResponse type usually only expects JSON body in this strict subset, though real apps need headers.
    }
  }
];
