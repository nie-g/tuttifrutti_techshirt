/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as billing from "../billing.js";
import type * as clients from "../clients.js";
import type * as colors from "../colors.js";
import type * as comments from "../comments.js";
import type * as designReferences from "../designReferences.js";
import type * as design_notifications from "../design_notifications.js";
import type * as design_preview from "../design_preview.js";
import type * as design_requests from "../design_requests.js";
import type * as design_templates from "../design_templates.js";
import type * as designer_pricing from "../designer_pricing.js";
import type * as designer_specialization from "../designer_specialization.js";
import type * as designers from "../designers.js";
import type * as designs from "../designs.js";
import type * as fabric_canvases from "../fabric_canvases.js";
import type * as files from "../files.js";
import type * as functions_invites from "../functions/invites.js";
import type * as functions_updateClerkUser from "../functions/updateClerkUser.js";
import type * as gallery from "../gallery.js";
import type * as getPreviewUrl from "../getPreviewUrl.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as notifications from "../notifications.js";
import type * as portfolio from "../portfolio.js";
import type * as ratings_and_feedback from "../ratings_and_feedback.js";
import type * as shirt_sizes from "../shirt_sizes.js";
import type * as shirt_types from "../shirt_types.js";
import type * as stats from "../stats.js";
import type * as userQueries from "../userQueries.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  billing: typeof billing;
  clients: typeof clients;
  colors: typeof colors;
  comments: typeof comments;
  designReferences: typeof designReferences;
  design_notifications: typeof design_notifications;
  design_preview: typeof design_preview;
  design_requests: typeof design_requests;
  design_templates: typeof design_templates;
  designer_pricing: typeof designer_pricing;
  designer_specialization: typeof designer_specialization;
  designers: typeof designers;
  designs: typeof designs;
  fabric_canvases: typeof fabric_canvases;
  files: typeof files;
  "functions/invites": typeof functions_invites;
  "functions/updateClerkUser": typeof functions_updateClerkUser;
  gallery: typeof gallery;
  getPreviewUrl: typeof getPreviewUrl;
  http: typeof http;
  inventory: typeof inventory;
  notifications: typeof notifications;
  portfolio: typeof portfolio;
  ratings_and_feedback: typeof ratings_and_feedback;
  shirt_sizes: typeof shirt_sizes;
  shirt_types: typeof shirt_types;
  stats: typeof stats;
  userQueries: typeof userQueries;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
