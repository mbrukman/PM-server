const Project = require("../models/project.model");
const Map = require("../models/map.model");

function archiveMaps(mapsIds, isArchive){
    return Map.update({ _id: { $in: mapsIds } }, { archived: isArchive }, { multi: true })
}

function archiveProject(projectId, isArchive){   
    return Project.findByIdAndUpdate(projectId, { archived: isArchive }).then(project => {
        return archiveMaps(project.maps, isArchive);
    });
}

module.exports = {
    /* archive project and maps */
    archiveProject: archiveProject,
    archiveMaps : archiveMaps
};