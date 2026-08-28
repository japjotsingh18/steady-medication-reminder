/** Cloudflare Worker entry point for Steady. */
import handler from "vinext/server/app-router-entry";

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, _env: Env, ctx: ExecutionContext): Promise<Response> {
    return handler.fetch(request, undefined, ctx);
  },
} satisfies ExportedHandler<Env>;

export default worker;
