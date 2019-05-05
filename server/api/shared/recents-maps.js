const MapResult = require("../models/map-results.model")

exports.recentsMaps = function (limit,execFields=[]){
    let $projectField = {
        project:1,
        map:1
    };
    if(execFields.length > 0){
        execFields.forEach((field) => {
            $projectField[`exec.${field}`]=1
        })
    }
    else{
        $projectField.exec = 1
    }
    return MapResult.aggregate([
        { 
            $match:{
                archivedMap : {$ne : true}
            }
        },
        { $sort: { "startTime": -1 } },
        {
            $group:
            {
                _id: "$map", count: { $sum: 1 },
                exec: { $first: "$$CURRENT" },
            }
        },
        { $sort: { "exec.startTime": -1 } },
        { $limit: limit },
        {
            $lookup:
            {
                from: "maps",
                let: { mapId: "$exec.map" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$$mapId", "$_id"]
                            }
                        }
                    },
                    {
                        $project:
                        {
                            name: 1
                        }
                    }
                ],
                as: "map",
            },
        },
        {
            $unwind: {
                "path": "$map",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup:
            {
                from: "projects",
                let: { mapId: "$exec.map" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ["$$mapId", "$maps"]
                            }
                        }
                    },
                    {
                        $project:
                        {
                            name: 1
                        }
                    }
                ],
                as: "project"
            },
        },
        {
            $unwind: {
                "path": "$project",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project:$projectField
        }
    ])
}

