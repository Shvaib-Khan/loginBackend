import request from "supertest";
import { app } from "../../src/app.js";

describe("Express App Routes", () => {
  describe("GET /", () => {
    it("should return status 200 and the correct message on the home route", async () => {
      // 1. Send a simulated GET request to the root URL ("/")
      const response = await request(app).get("/");

      // 2. Assert the HTTP status code is 200 (OK)
      expect(response.status).toBe(200);

      // 3. Assert the response text matches what we expect
      expect(response.text).toBe("This is home route");
    });

    it("should not break when a query string is attached to the home route", async () => {
      const response = await request(app).get("/?foo=bar&page=2");

      expect(response.status).toBe(200);
      expect(response.text).toBe("This is home route");
    });

    it("should serve the response with the expected Content-Type header", async () => {
      const response = await request(app).get("/");

      // express res.send() on a string defaults to text/html
      expect(response.headers["content-type"]).toMatch(/^text\/html/);
    });

    it("should include a Content-Length header matching the body size", async () => {
      const response = await request(app).get("/");

      const expectedLength = Buffer.byteLength("This is home route", "utf8");
      expect(Number(response.headers["content-length"])).toBe(expectedLength);
    });
  });

  describe("HEAD /", () => {
    it("should return status 200 with an empty body (Express auto-handles HEAD for GET routes)", async () => {
      const response = await request(app).head("/");

      expect(response.status).toBe(200);
      // HEAD responses carry no body at all
      expect(response.text).toBeUndefined();
    });
  });

  describe("unsupported methods on the home route", () => {
    it.each(["post", "put", "delete", "patch"])(
      "should return 404 when the home route is hit with %s",
      async (method) => {
        const response = await request(app)[method]("/");

        // Express has no route registered for these methods, so it falls
        // through to the default 404 handler
        expect(response.status).toBe(404);
      },
    );
  });

  describe("unknown routes", () => {
    it("should return 404 for an unknown path", async () => {
      const response = await request(app).get("/does-not-exist");

      expect(response.status).toBe(404);
    });

    it("should return 404 for a nested unknown path", async () => {
      const response = await request(app).get("/api/v1/users");

      expect(response.status).toBe(404);
    });
  });
});
