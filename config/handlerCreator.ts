import { Request, Response } from 'express';
import { NextFunction } from 'express-serve-static-core';

export type ResponseData = { code?: number; body: any }
export type PromisedResponse = Promise<ResponseData>;
type Callback = (req?: Request) => PromisedResponse;
type ExpressJsCallback = (req: Request, res: Response, next: NextFunction) => any;

export const handler = (callbackFn: Callback): ExpressJsCallback => {
  return async (req: Request, res: Response) => {
    const { code, body } = await callbackFn(req);
    return code ? res.status(code).json(body) : res.json(body);
  };
};
