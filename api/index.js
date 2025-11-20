// Redirect root to /public/index.html
module.exports = (req, res) => {
  res.writeHead(302, { Location: '/landing.html' });
  res.end();
};

