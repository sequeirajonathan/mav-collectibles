import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import type { ApiError, ApiErrorCode } from "@lib/contracts/common";
import { requireUser } from "@lib/auth/server";
import type { UserRole } from "@interfaces/roles";

const STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};

/** Throw from a handler to return a typed error response. */
export class HttpError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string
  ) {
    super(message);
  }
}

function errorResponse(code: ApiErrorCode, message: string, issues?: z.core.$ZodIssue[]) {
  const body: ApiError = {
    error: {
      code,
      message,
      ...(issues ? { issues: issues.map((i) => ({ path: i.path.join("."), message: i.message })) } : {}),
    },
  };
  return NextResponse.json(body, { status: STATUS[code] });
}

type RouteContext = { params: Promise<Record<string, string | string[]>> };

interface RouteConfig<
  TParams extends z.ZodType,
  TQuery extends z.ZodType,
  TBody extends z.ZodType,
  TResponse extends z.ZodType,
> {
  params?: TParams;
  query?: TQuery;
  body?: TBody;
  response: TResponse;
  /** Roles allowed to call this route (on top of the proxy policy). Omit for public. */
  roles?: readonly UserRole[] | "user";
  handler: (input: {
    params: z.infer<TParams>;
    query: z.infer<TQuery>;
    body: z.infer<TBody>;
    request: NextRequest;
    userId: string | null;
  }) => Promise<z.input<TResponse>>;
}

/**
 * Defines a route handler whose params, query, body and response are all
 * validated against Zod contracts. The response is validated too, so the
 * client can trust the shape it receives.
 */
export function defineRoute<
  TParams extends z.ZodType = z.ZodUndefined,
  TQuery extends z.ZodType = z.ZodUndefined,
  TBody extends z.ZodType = z.ZodUndefined,
  TResponse extends z.ZodType = z.ZodType,
>(config: RouteConfig<TParams, TQuery, TBody, TResponse>) {
  return async (request: NextRequest, context: RouteContext): Promise<NextResponse> => {
    try {
      let userId: string | null = null;
      if (config.roles) {
        const guard = await requireUser(config.roles === "user" ? undefined : config.roles);
        if (guard.response) return guard.response;
        userId = guard.user.id;
      }

      const parse = <S extends z.ZodType>(schema: S | undefined, value: unknown) =>
        schema ? schema.safeParse(value) : ({ success: true, data: undefined } as const);

      const params = parse(config.params, await context.params);
      if (!params.success) return errorResponse("NOT_FOUND", "Not found");

      const query = parse(config.query, Object.fromEntries(request.nextUrl.searchParams));
      if (!query.success) return errorResponse("BAD_REQUEST", "Invalid query", query.error.issues);

      let rawBody: unknown = undefined;
      if (config.body) {
        rawBody = await request.json().catch(() => undefined);
      }
      const body = parse(config.body, rawBody);
      if (!body.success) return errorResponse("BAD_REQUEST", "Invalid request body", body.error.issues);

      const result = await config.handler({
        params: params.data as z.infer<TParams>,
        query: query.data as z.infer<TQuery>,
        body: body.data as z.infer<TBody>,
        request,
        userId,
      });

      const output = config.response.safeParse(result);
      if (!output.success) {
        console.error(`Response contract violated for ${request.nextUrl.pathname}`, output.error.issues);
        return errorResponse("INTERNAL", "Unexpected response");
      }
      return NextResponse.json(output.data);
    } catch (error) {
      // Let Next.js control-flow errors (redirects, prerender bailouts) through.
      unstable_rethrow(error);
      if (error instanceof HttpError) return errorResponse(error.code, error.message);
      console.error(`Unhandled error in ${request.nextUrl.pathname}`, error);
      return errorResponse("INTERNAL", "Something went wrong");
    }
  };
}
