export function sendSuccess(res, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data
  });
}

export function sendError(res, message = "Erro interno do servidor", statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    message
  });
}