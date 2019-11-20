const IAMPolicy = require("../models/iam-policy.model");

async function updateOne(policyId, valueToUpdate) {
  return IAMPolicy.findByIdAndUpdate(
    policyId,
    {
      $set: valueToUpdate
    },
    {
      new: true,
      returnOriginal: false
    }
  );
}

module.exports = {
  updateOne
};
