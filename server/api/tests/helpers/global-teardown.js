module.exports = async () => {
  await new Promise((resolve) => {
    global.server.close(resolve);
  });
};
