module.exports = {
  settings: (req, res) =>
    res.send({
      isSetup: !!process.env.DB_URI,
      version: global.kaholo.VERSION
    }),

  setupDbConnectionString: (req, res) => {
    const { uri } = req.body;
    if (!uri) {
      return res.status(500).send("Missing parameters");
    }
    return res.status(204).send();
  }
};
