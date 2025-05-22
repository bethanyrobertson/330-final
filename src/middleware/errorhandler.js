const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
  
    // different error types
    if (err.name === 'CastError') {
      // MongoDB ObjectId errors
    }
    
    if (err.code === 11000) {
      // Duplicate key errors
    }
    
  };