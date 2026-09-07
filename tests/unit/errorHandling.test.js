import { jest } from "@jest/globals";
import { ApiResponse } from "../../src/utils/ApiResponse.js";
import { ApiError } from "../../src/utils/ApiError.js";
import { errorHandler } from "../../src/middlewares/error.middleware.js";

describe("ApiResponse", () => {
  it("should set statusCode, data, message, and success for a 200 response", () => {
    const res = new ApiResponse(200, { id: 1 }, "OK");
    expect(res.statusCode).toBe(200);
    expect(res.data).toEqual({ id: 1 });
    expect(res.message).toBe("OK");
    expect(res.success).toBe(true);
  });

  it("should set success to true for 2xx status codes", () => {
    expect(new ApiResponse(201, null, "Created").success).toBe(true);
    expect(new ApiResponse(204, null, "No Content").success).toBe(true);
  });

  it("should set success to false for 4xx and 5xx status codes", () => {
    expect(new ApiResponse(400, null, "Bad Request").success).toBe(false);
    expect(new ApiResponse(404, null, "Not Found").success).toBe(false);
    expect(new ApiResponse(500, null, "Server Error").success).toBe(false);
  });

  it("should default message to 'Success' when not provided", () => {
    const res = new ApiResponse(200, { foo: "bar" });
    expect(res.message).toBe("Success");
  });

  it("should allow null data", () => {
    const res = new ApiResponse(200, null);
    expect(res.data).toBeNull();
    expect(res.success).toBe(true);
  });
});

describe("ApiError", () => {
  it("should extend the built-in Error class", () => {
    const err = new ApiError(400, "Bad request");
    expect(err instanceof Error).toBe(true);
    expect(err instanceof ApiError).toBe(true);
  });

  it("should set statusCode, message, and errors from constructor arguments", () => {
    const err = new ApiError(422, "Validation failed", [
      { field: "email", message: "Invalid email" },
    ]);
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe("Validation failed");
    expect(err.errors).toEqual([{ field: "email", message: "Invalid email" }]);
    expect(err.success).toBe(false);
    expect(err.data).toBeNull();
  });

  it("should convert a single error object into an errors array", () => {
    const err = new ApiError(400, "Error", { field: "name", message: "Required" });
    expect(Array.isArray(err.errors)).toBe(true);
    expect(err.errors).toEqual([{ field: "name", message: "Required" }]);
  });

  it("should default errors to an empty array when not provided", () => {
    const err = new ApiError(500, "Server error");
    expect(err.errors).toEqual([]);
  });

  it("should capture stack trace when stack argument is not provided", () => {
    const err = new ApiError(404, "Not found");
    expect(err.stack).toBeTruthy();
    // Error.captureStackTrace creates a stack trace; we just verify it exists
    expect(err.stack).toContain("Not found");
  });

  it("should use the provided stack trace when given", () => {
    const customStack = "Custom stack trace";
    const err = new ApiError(400, "Error", [], customStack);
    expect(err.stack).toBe(customStack);
  });

  it("should preserve the name property as 'Error' (inherited from Error class)", () => {
    const err = new ApiError(400, "Error");
    // ApiError extends Error, so name defaults to the class name 'Error' unless explicitly set
    expect(err.name).toBeDefined();
  });
});

describe("errorHandler middleware", () => {
  let mockReq;
  let mockRes;
  let nextFn;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFn = jest.fn();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return 500 and generic message for errors without statusCode", () => {
    const err = new Error("Something broke");
    errorHandler(err, mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error",
      data: null,
      errors: [],
    });
  });

  it("should return the error message for known status codes", () => {
    const err = new ApiError(404, "Resource not found");
    errorHandler(err, mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Resource not found",
      data: null,
      errors: [],
    });
  });

  it("should include structured errors array when provided", () => {
    const err = new ApiError(422, "Validation failed", [
      { field: "email", message: "Invalid email" },
      { field: "password", message: "Too short" },
    ]);
    errorHandler(err, mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation failed",
      data: null,
      errors: [
        { field: "email", message: "Invalid email" },
        { field: "password", message: "Too short" },
      ],
    });
  });

  it("should log the error to console for 500 status codes", () => {
    const err = new Error("Database down");
    errorHandler(err, mockReq, mockRes, nextFn);

    expect(console.error).toHaveBeenCalledWith(err);
  });

  it("should not log to console for non-500 status codes", () => {
    const err = new ApiError(400, "Bad request");
    errorHandler(err, mockReq, mockRes, nextFn);

    expect(console.error).not.toHaveBeenCalled();
  });

  it("should handle errors with non-array errors property gracefully", () => {
    const err = new ApiError(400, "Error", "not-an-array");
    errorHandler(err, mockReq, mockRes, nextFn);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Error",
      data: null,
      errors: ["not-an-array"],
    });
  });

  it("should use default 500 statusCode when err.statusCode is undefined", () => {
    const err = new Error("Unknown error");
    errorHandler(err, mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});
