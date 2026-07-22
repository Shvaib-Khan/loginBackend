const asyncHandler = (requestHandler) => {
<<<<<<< HEAD
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
=======
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export { asyncHandler }
>>>>>>> 2af45b6 (Enhance API reliability by implementing centralized error handling and response formatting)
