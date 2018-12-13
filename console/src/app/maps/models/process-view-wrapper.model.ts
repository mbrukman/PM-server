import { Process } from "./process.model";
import { MapStructure } from "./map-structure.model";

export class ProcessViewWrapper {
    process : Process;
    isInsideLoop : boolean;

    constructor(process : Process ,  mapStructure : MapStructure ){
        this.process =  new Process(process);
        this.updateIsInsideLoop(mapStructure);
    }


    updateIsInsideLoop(mapStructure : MapStructure){
        this.isInsideLoop = mapStructure.links.find(link => ((link.targetId === this.process.uuid) && ( link.sourceId == link.targetId))) ? true : false ;
      }
  }


  