const { updateOne } = require("../services/iam-policy.service");

async function updatePolicy(req, res) {
  try {
    const { id } = req.params;
    const { body } = req;
    const updatedPolicy = await updateOne(id, body);
    req.io.emit("notification", {
      title: "Policy updated",
      message: `Policy has been updated successfully!`,
      type: "success"
    });
    return res.status(200).json(updatedPolicy);
  } catch (err) {
    req.io.emit("notification", {
      title: "Policy updated",
      message: `There was an error updating a policy.`,
      type: "error"
    });
    return res.status(500).json(err);
  }
}

module.exports = {
  updatePolicy
};
