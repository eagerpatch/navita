import { z } from "zod";
import qino from "../";

export const documentationTree = qino.defineTree({
  directory: "documentation",
  extension: ".md",
  titleField: "title",
  schema: z.object({
    title: z.string(),
    description: z.string().nullable().optional(),
  }),
});
