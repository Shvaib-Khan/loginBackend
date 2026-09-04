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
});
