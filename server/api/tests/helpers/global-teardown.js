module.exports = () => {
    return new Promise((resolve, reject) => {
        global.server.close(resolve);
    });

}
