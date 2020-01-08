const tosService = require("../services/tos.service");

module.exports = {
  async acceptTos(req, res) {
    try {
      if (req.body && req.body.isAccepted) {
        const tosStatus = await tosService.acceptTos(req.body);
        return res.status(200).json(tosStatus);
      }
      throw new Error("TOS not accepted!");
    } catch (err) {
      res.status(403).send(err.message);
    }
  },
  async getTos(req, res) {
    try {
      const tosStatus = await tosService.getTos();
      return res.status(200).json(tosStatus);
    } catch (err) {
      res.status(500).send(err.message);
    }
  }
};
