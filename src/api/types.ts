import type { Logger } from "../shared/types.ts";
import { RunService } from "./services/RunService.ts";
import { ArtifactsService } from "./services/ArtifactsService.ts";

export type ApiMethod = "GET" | "POST";

export type ApiRequest = {
  method: ApiMethod;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string>;
};

export type ApiResponse<T = unknown> = {
  status: number;
  body: T;
};

export type ApiHandler = (request: ApiRequest, context: ApiContext) => Promise<ApiResponse>;

export type ApiContext = {
  logger: Logger;
  services: {
    runService: RunService;
    artifactsService: ArtifactsService;
  };
};

export type RouteDefinition = {
  method: ApiMethod;
  path: string;
  handler: ApiHandler;
};
