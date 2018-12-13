import { Process } from "./process.model";
import { MapStructure } from "./map-structure.model";
import { Plugin } from "../../plugins/models/plugin.model";

export class ProcessViewWrapper {
    process : Process;
    isInsideLoop : boolean;
    plugin:Plugin;
    constructor(process : Process ,  mapStructure : MapStructure, plugins:Plugin[] ){
        this.process =  new Process(process);
        this.updateIsInsideLoop(mapStructure);
        this.findPluginForProcess(plugins)
    }


    updateIsInsideLoop(mapStructure : MapStructure){
        this.isInsideLoop = mapStructure.links.find(link => ((link.targetId === this.process.uuid) && ( link.sourceId == link.targetId))) ? true : false ;
      }
    
    findPluginForProcess(plugins){
        if(this.process.used_plugin){
            for(let i=0, pluginsLength = plugins.length; i<pluginsLength; i++){
                if(this.process.used_plugin.name == plugins[i].name){
                return this.plugin = plugins[i]
                }
            }
        }
    } 
}


  