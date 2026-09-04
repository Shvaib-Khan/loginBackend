import request from "supertest";
import { app } from "../../src/app.js";

describe("Express App Routes", () => {
  it("should return status 200 and the correct message on the home route", async () => {
    // 1. Send a simulated GET request to the root URL ("/")
    const response = await request(app).get("/");

    // 2. Assert the HTTP status code is 200 (OK)
    expect(response.status).toBe(200);

    // 3. Assert the response text matches what we expect
    expect(response.text).toBe("This is home route");
  });

  it("should serve the home route as HTML (edge case: content-type)", async () => {
    const response = await request(app).get("/");

    // Express text responses are sent as text/html by default
    expect(response.headers["content-type"]).toMatch(/text\/html/);
  });

  it("should return 404 for an unknown route (edge case)", async () => {
    // 1. Ask for a route that was never registered
    const response = await request(app).get("/nonexistent-route");

    // 2. Express answers with 404 Not Found
    expect(response.status).toBe(404);
  });

  it("should return 404 when the HTTP method is not allowed on a route (edge case)", async () => {
    // 1. /api/v1/users/register only accepts POST, so a GET must not match it
    const response = await request(app).get("/api/v1/users/register");

    // 2. Since no GET handler exists, Express falls through to 404
    expect(response.status).toBe(404);
  });

  it("should return 404 for POST on the home route (edge case)", async () => {
    // 1. The home route only registers a GET handler
    const response = await request(app).post("/");

    // 2. A POST is not matched, so we get 404
    expect(response.status).toBe(404);
  });
});