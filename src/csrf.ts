import type { RequestHandler } from "express";
import { sendErrorPage } from "./errors.ts";
import { timingSafeEqual } from "node:crypto";

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

export function csrfTokensMatch(expected: string, actual: unknown): boolean {
  if(typeof actual !== "string") {
    return false;
  }

  const actualToken = Buffer.from(actual, "base64url");
  const expectedToken = Buffer.from(expected, "base64url");

  if(actualToken.length !== expectedToken.length) {
    return false;
  }else if (timingSafeEqual(actualToken, expectedToken)){
    return true;
  }

  return false;
}
