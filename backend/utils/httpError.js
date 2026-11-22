// Error with an HTTP status; the central error handler sends `message` to the client.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;
