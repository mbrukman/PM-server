const path = require("path");


module.exports = {
    static_cdn: path.join(path.dirname(path.dirname(__dirname)), "static_cdn"),
    upload_path: "uploads",
    interval_time: 5000,
    retries: 3,
    page_size: 15
};