const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tosPermissionSchema = new Schema(
  {
    isAccepted: { type: Boolean, required: true }
  },
  { capped: { size: 1024, max: 1, autoIndexId: true } }
);

const tosPermission = mongoose.model(
  "TOSPermission",
  tosPermissionSchema,
  "tosPermissions"
);

module.exports = tosPermission;
