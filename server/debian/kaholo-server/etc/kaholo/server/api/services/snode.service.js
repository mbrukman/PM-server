const SNode = require("../models/snode.model");


module.exports = {
    addParent: (nodeId, parentId) => {

    },
    /* create new SNode */
    create: (node) => {
        return SNode.create(node)
    },
    /* filter snodes by query. if query is null, return a list of all SNodes.*/
    filter: (query = {}) => {
        return SNode.find(query)
    },
    /* update a given node. will return the new instance */
    update: (node) => {
        return SNode.findByIdAndUpdate(node._id, node, { new: true })
    }
};
