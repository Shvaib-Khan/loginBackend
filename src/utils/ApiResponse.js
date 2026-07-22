class ApiResponse {
<<<<<<< HEAD
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode >= 200 && statusCode < 400;
  }
}

export { ApiResponse };
=======
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export { ApiResponse }
>>>>>>> 2af45b6 (Enhance API reliability by implementing centralized error handling and response formatting)
