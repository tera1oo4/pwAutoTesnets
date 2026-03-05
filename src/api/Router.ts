import type { ApiContext, ApiHandler, ApiRequest, ApiResponse, RouteDefinition } from "./types.ts";

type MatchResult = {
  handler: ApiHandler;
  params: Record<string, string>;
};

export class Router {
  private readonly routes: RouteDefinition[];

  constructor(routes: RouteDefinition[]) {
    this.routes = routes;
  }

  async handle(request: ApiRequest, context: ApiContext): Promise<ApiResponse> {
    const match = this.match(request.method, request.path);
    if (!match) {
      return { status: 404, body: { error: "NotFound" } };
    }
    return match.handler(
      {
        ...request,
        params: match.params
      },
      context
    );
  }

  private match(method: string, path: string): MatchResult | null {
    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }
      const params = matchPath(route.path, path);
      if (params) {
        return { handler: route.handler, params };
      }
    }
    return null;
  }
}

const matchPath = (pattern: string, path: string): Record<string, string> | null => {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) {
    return null;
  }
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];
    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = pathPart;
    } else if (patternPart !== pathPart) {
      return null;
    }
  }
  return params;
};
