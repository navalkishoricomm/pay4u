// Utility function to catch async errors and pass them to the global error handler
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};