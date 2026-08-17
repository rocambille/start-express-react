/*
  Purpose:
  Provide shared utilities for Express modules.

  Related docs:
  - https://expressjs.com/en/5x/api.html#router.param
*/

import type { RequestParamHandler } from "express";

/* ************************************************************************ */
/* createParamConverter                                                     */
/* ************************************************************************ */

/*
  createParamConverter(repository, requestKey):
  - Returns an Express param middleware for router.param()
  - Loads an entity from the repository and attaches it to req[requestKey]
  - Returns 404 if not found (or 204 for DELETE, for idempotency)

  Contract:
  - repository must expose a `find(id: number)` method returning T | null
*/
export const createParamConverter = <
  T extends { id: number },
  Repository extends { find: (id: T["id"]) => T | null },
>(
  repository: Repository,
  requestKey: string,
): { convert: RequestParamHandler } => {
  return {
    convert: (req, res, next, stringId) => {
      const entity = repository.find(Number(stringId));

      if (entity == null) {
        res.sendStatus(req.method === "DELETE" ? 204 : 404);
        return;
      }

      Object.assign(req, { [requestKey]: entity });

      next();
    },
  };
};
