const termsOfUseService = require("../services/terms-of-use.service");

module.exports = {
  async acceptTos(req, res) {
    try {
      if (req.body && req.body.isAccepted) {
        const termsOfUseStatus = await termsOfUseService.acceptTermsOfUse(
          req.body
        );
        return res.status(200).json(termsOfUseStatus);
      }
      throw new Error("TOS not accepted!");
    } catch (err) {
      res.status(403).send(err.message);
    }
  },
  async getTos(req, res) {
    try {
      const termsOfUseStatus = await termsOfUseService.getTermsOfUse();
      return res.status(200).json(termsOfUseStatus);
    } catch (err) {
      res.status(500).send(err.message);
    }
  }
};
