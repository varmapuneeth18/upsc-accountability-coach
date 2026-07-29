// Express 4 doesn't forward rejected promises from async handlers to the
// error middleware on its own — this wrapper makes sure a thrown/rejected
// error always reaches next() instead of leaving the request hanging.
export function ah(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
