
const {Project} = require("../models");
const Map = require("../models/map.model");
const { MapResult } = require("../models/map-results.model");

function archiveMaps(mapsIds, isArchive) {
  return Map.update(
    { _id: { $in: mapsIds } },
    { archived: isArchive },
    { multi: true }
  ).then(() => {
    return MapResult.update(
      { map: { $in: mapsIds } },
      { archivedMap: isArchive },
      { multi: true }
    );
  });
}

function archiveProject(projectId, isArchive) {
  return Project.findByIdAndUpdate(
    projectId,
    { archived: isArchive },
    { new: true }
  ).then(project => {
    return archiveMaps(project.maps, isArchive);
  });
}

module.exports = {
  /* archive project and maps */
  archiveProject: archiveProject,
  archiveMaps: archiveMaps
};
