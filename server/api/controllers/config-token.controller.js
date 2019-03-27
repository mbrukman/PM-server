const tokenService = require('../services/token.service');

module.exports = {
    createToken:(req,res)=>{
        let payload = req.body;
        let token = tokenService.createToken(payload,{ expiresIn: "7d"})
        res.send(token)
    }
}