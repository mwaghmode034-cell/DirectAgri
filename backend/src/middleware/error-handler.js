export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error.name === "ZodError") {
    const message = error.errors?.map((item) => item.message).join(" ") || "Invalid request";
    response.status(400).json({ error: message });
    return;
  }

  const status = error.status ?? 500;
  const isDevelopment = process.env.NODE_ENV !== "production";
  const message = status === 500 && !isDevelopment ? "Something went wrong" : error.message;
  response.status(status).json({ error: message, blockedFields: error.blockedFields });
}
