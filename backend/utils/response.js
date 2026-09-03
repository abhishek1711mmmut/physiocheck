const sendResponse = (res, statusCode, success, data, message, error = null) => {
  res.status(statusCode).json({ success, data, message, error });
};

module.exports = sendResponse;
