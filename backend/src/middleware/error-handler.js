export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  const status = error.name === "ZodError" ? 400 : error.status ?? 500;
  const isDevelopment = process.env.NODE_ENV !== "production";
  const message = status === 500 && !isDevelopment ? "Something went wrong" : error.message;
  response.status(status).json({ error: message, blockedFields: error.blockedFields });
}
