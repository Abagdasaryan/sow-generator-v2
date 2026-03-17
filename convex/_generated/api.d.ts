/* eslint-disable */
/**
 * Generated API stubs.
 * To regenerate, run `npx convex dev`.
 */
import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as sows from "../sows.js";
import type * as versions from "../versions.js";
import type * as approvals from "../approvals.js";
import type * as comments from "../comments.js";
import type * as templates from "../templates.js";
import type * as users from "../users.js";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  http: typeof http;
  sows: typeof sows;
  versions: typeof versions;
  approvals: typeof approvals;
  comments: typeof comments;
  templates: typeof templates;
  users: typeof users;
}>;

export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
