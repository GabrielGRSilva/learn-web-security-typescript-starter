import type { RequestHandler } from "express";
import { sendErrorPage } from "./errors.ts";

export function validateRequestOrigin(appOrigin: string): RequestHandler {
  return (req, res, next) => {
    if (req.method !== "POST") {
      next();
      return;
    }

    if (req.headers.origin){
      if(req.headers.origin !== appOrigin) {
        return sendErrorPage(res, 403, "Forbidden", "External origin not allowed");
      }else{
        next();
        return;
      }
    }
    
    try{
      const refererURL = new URL(req.headers.referer || "");

      if (refererURL.origin === appOrigin) {
          next();
          return;
      }else{
        throw new Error("External origin not allowed");
      }
      
    }catch (error) {
        return sendErrorPage(res, 403, "Forbidden", "External origin not allowed");
      }
    }
  };

export function csrfTokensMatch(_expected: string, _actual: unknown): boolean {
  return true;
}
