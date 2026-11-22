// Work that goes on after the answer is sent, such as an email. Vercel stops a request's
// code once it has answered, unless it is told to wait. On a computer this changes nothing.
function inBackground(promise) {
  const context = globalThis[Symbol.for("@vercel/request-context")]?.get?.();
  context?.waitUntil?.(promise);
  return promise;
}

module.exports = { inBackground };
