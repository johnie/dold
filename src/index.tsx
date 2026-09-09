import { Hono } from "hono";
import type { Handler } from "hono";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";

import { titleTemplate } from "@/lib/utils";
import { renderer } from "@/renderer";
import decryptRoute from "@/routes/decrypt";
import encryptRoute from "@/routes/encrypt";
import type { DoldApp } from "@/types";

const app = new Hono<DoldApp>();

app.use("*", secureHeaders());
app.use("*", csrf());
app.use(renderer);

const renderShell: Handler<DoldApp> = (c) =>
  c.render(<div id="root" />, {
    description: "Welcome to Dold, your secure message encryption service.",
    title: titleTemplate("Home"),
  });

app.get("/", renderShell);
app.get("/m/:id", renderShell);

const routes = app
  .route("/api/encrypt", encryptRoute)
  .route("/api/decrypt", decryptRoute);

export type RouteType = typeof routes;

export default app;
