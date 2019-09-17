module.exports = async () => {
    await new Promise((resolve, reject) => {
        global.server.close(resolve);
    });

}
