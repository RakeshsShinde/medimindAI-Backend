import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

interface RequestSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export const validate = (schema: RequestSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = (await schema.query.parseAsync(req.query)) as any;
      }
      if (schema.params) {
        req.params = (await schema.params.parseAsync(req.params)) as any;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
