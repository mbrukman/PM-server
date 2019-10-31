import {Process} from '@maps/models';
import {MapStructure} from '@maps/models';
import {Plugin} from '@plugins/models';

export class ProcessViewWrapper {
  process: Process;
  isInsideLoop: boolean;
  plugin: Plugin;

  constructor(process: Process, mapStructure: MapStructure, plugins: Plugin[]) {
    this.process = new Process(process);
    this.updateIsInsideLoop(mapStructure);
    this.findPluginForProcess(plugins);
  }


  updateIsInsideLoop(mapStructure: MapStructure) {
    this.isInsideLoop = !!mapStructure.links.find(link => ((link.targetId === this.process.uuid) && (link.sourceId === link.targetId)));
  }

  findPluginForProcess(plugins) {
    if (this.process.used_plugin) {
      for (let i = 0, pluginsLength = plugins.length; i < pluginsLength; i++) {
        if (this.process.used_plugin.name === plugins[i].name) {
          return this.plugin = plugins[i];
        }
      }
    }
  }
}


