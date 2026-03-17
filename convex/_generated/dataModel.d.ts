/* eslint-disable */
/**
 * Generated data model types.
 * To regenerate, run `npx convex dev`.
 */
import type { DataModelFromSchemaDefinition, GenericId } from "convex/server";
import type schema from "../schema.js";

export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
export type Id<TableName extends string> = GenericId<TableName>;
