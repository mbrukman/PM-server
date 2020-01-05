module.exports = {
    getSetings: ()=>{
        return {
            isSetup: !!process.env.DB_URI,
            version: global.kaholo.VERSION
        };
    },
    settings: (req, res) => res.send(module.exports.getSetings()),
    setupDbConnectionString: (req, res) => {
        const {uri} = req.body;
        if (!uri) {
            return res.status(500).send('Missing parameters')
        }
        return res.status(204).send();
        },
    }
