const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const mapSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    archived: { type: Boolean, default: false, index: true },
    agents: [{ type: Schema.Types.ObjectId, ref: "Agent" }],
    groups: [{ type: Schema.Types.ObjectId, ref: "Group" }],
    queue: Number,
    processResponse: { type: String, default: null },
    apiResponseCodeReference: { type: String }
  },
  { timestamps: true }
);

mapSchema.statics.autocompleteKey = "name";
mapSchema.statics.autocompleteValueField = "_id";

mapSchema.post("save", async doc => {
  const UserGroupModel = mongoose.model("UserGroup");
  const UserModel = mongoose.model("User");
  const MapPolicyModel = mongoose.model("MapPolicy");
  const projectPolicyPopulate = {
    path: "projectPolicy",
    model: "ProjectPolicies",
    populate: {
      path: "projects",
      model: "ProjectPolicy"
    }
  };
  const users = await UserModel.find({})
    .populate(projectPolicyPopulate)
    .exec();
  const userGroups = await UserGroupModel.find({})
    .populate(projectPolicyPopulate)
    .exec();

  const mapItemsToPolicies = async item => {
    const mapPolicy = new MapPolicyModel();
    mapPolicy.map = doc;
    if (!item.maps) {
      item.maps = [];
    }

    item.maps.push(mapPolicy);

    await item.save();
    console.log(item);
    return mapPolicy.save();
  };

  const mapUsers = async user => {
    console.log(user);
    if (user.projectPolicy) {
      await Promise.all(user.projectPolicy.projects.map(mapItemsToPolicies));
    }
    return user.save();
  };

  const mapUserGroups = async userGroup => {
    if (userGroup.projectPolicy) {
      await Promise.all(
        userGroup.projectPolicy.projects.map(mapItemsToPolicies)
      );
    }
    return userGroup.save();
  };

  const mappedUserToPromises = users.map(mapUsers);
  const mappedUserGroupsToPromises = userGroups.map(mapUserGroups);
  return Promise.all(mappedUserToPromises.concat(mappedUserGroupsToPromises));
});

mapSchema.set("toJSON", {
  transform: function(doc, ret, options) {
    ret.id = ret._id;
  }
});

const Map = mongoose.model("Map", mapSchema, "maps");

module.exports = Map;
