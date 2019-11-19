class GetEnvHelper {
  isTestEnvironment() {
    return process.env.NODE_ENV === "test";
  }
}

const getEnvHelper = new GetEnvHelper();
module.exports = getEnvHelper;
