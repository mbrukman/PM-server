import {MapResult} from '@maps/models/execution-result.model';
import {Map} from '@maps/models/map.model';

export class DistinctMapResult{
    map:{name:string,archived:boolean};
    project:{name:String}
    exec:MapResult;
    count?:number;
    name?:string;
    constructor(public recentMap:Map){
        this.map = { name : recentMap.name, archived :recentMap.archived},
        this.project = {name:recentMap.project.name}
        this.exec = recentMap.exec;
        this.name = recentMap.name;
    }
}