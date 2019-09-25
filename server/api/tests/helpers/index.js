const socket = require('socket.io-client');
const MapModel = require('../../models/map.model');
const { MapStructure } = require('../../models/map-structure.model');
const TestDataManager = require('../factories/test-data-manager');
const mapsFactory = require('../factories/maps.factory');
const mapStructureFactory = require('../factories/map-structure.factory');

module.exports = {
    randomIdx(length) {
        return Math.floor(Math.random() * length);
    },

    connectToSocket(url = 'http://localhost:3000/') {
        const io = socket(url);
        return new Promise((resolve, reject) => {
            io.on('connect', () => {
                resolve(io);
            });
        });
    },

    generateMapStructure: async () => {
        let mapDataManager = new TestDataManager(MapModel);
        let mapStructureDataManager = new TestDataManager(MapStructure);
        const map = mapsFactory.generateSimpleMap();
        map.queue = 3;
        await mapDataManager.generateInitialCollection(map);
        mapId = map._id;
        await mapStructureDataManager.generateInitialCollection(mapStructureFactory.generateOne(mapId));
        return mapId;
    }
};
