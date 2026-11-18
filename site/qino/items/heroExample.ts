import { z } from "zod";
import qino from "../";

export const heroExampleItem = qino.defineItem({
  file: "examples/button.md",
  schema: z.object({}),
});
