import { Process } from "./process.model";
import { MapStructure } from "./map-structure.model";

export class ProcessViewWrapper {
    process : Process;
    isInsideLoop : boolean;

    constructor(process : Process ,  isInsideLoop : boolean = false ){
        this.process =  new Process(process);
        this.isInsideLoop = isInsideLoop;
        console.log("create", isInsideLoop, process);
        
    }


    updateIsInsideLoop(mapStructure : MapStructure){
        const ancestors = mapStructure.links.filter(link => link.targetId === this.process.uuid);
        this.isInsideLoop =  ancestors.filter(link => link.sourceId == link.targetId).length > 0 ;
      }

  

  }


  