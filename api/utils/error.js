class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  class FileFormatError extends AppError {
    constructor(message) {
      super(message, 400);
    }
  }
  
  class ColumnNotFoundError extends AppError {
    constructor(message) {
      super(message, 404);
    }
  }
  
  module.exports = {
    AppError,
    FileFormatError,
    ColumnNotFoundError
  };