const Trigger = require("../models/map-trigger.model");

module.exports = {
    /* create a new trigger */
    create: (mapId, trigger) => {
        trigger.map = mapId;
        return Trigger.create(trigger)
    },
    /* delete a trigger */
    delete: (triggerId) => {
        return Trigger.remove({ _id: triggerId })
    },
    /* list of triggers to given map */
    list: (mapId) => {
        return Trigger.find({ map: mapId })
    },
    /* update a trigger */
    update: (triggerId, trigger) => {
        return Trigger.findByIdAndUpdate(triggerId, trigger, { new: true })
    }
};