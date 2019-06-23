
declare class KaholoTrigger {
    msg: string;
    payload: any;
}

declare class KaholoAgent {
    name: string;
    url: string;
    attributes: [{ name: string }]
}

declare class KaholoPlugin{
    name: String;
    version: String;
}

declare class KaholoAction {
    server: { type: string, name: string, id: string };
    method: String | {
        params: [
            {
                name: string,
                type: string,
                id: string
            }
        ],
        agent: {
            type: string,
            id: string
        },
        name: string,
        actionString: string,
        createdAt: string,
        updatedAt: string,
        id: string
    };
    params: [object];
    name: string;
    timeout: number;
    timeunit: number;
    retries: number;
    mandatory: boolean;
    suspend: boolean;
    result: string;
    status: number;
    id: number;
    order: number;
    lastUpdate: number
}

declare class KaholoProcess {
    id: number;
    name: string;
    description: string;
    order: number;
    default_execution: boolean;
    mandatory: boolean;
    actions: [KaholoAction];
    result: string;

    preRun: String;
    postRun: String;
    filterAgents: String;
    coordination: String;
    flowControl: String;
    correlateAgents: boolean;
    condition: String;
    createdAt: String;
    used_plugin: KaholoPlugin;
    uuid: String
}

declare class KaholoLink {
    id: string;
    sourceId: string;
    targetId: string;
    processes: [KaholoProcess];
    result: string;
    linkIndex: 0
}

declare class KaholoVault {
    /**
     * Get vault from vault by key
     * @param key 
     */
    getValueByKey(key: string): Promise<any>
}

declare class KaholoActionResult{
    action: String;
    status: String;
    startTime: String;
    finishTime: String;
    result: any;
    retriesLeft: Number
    id:string
}

declare class KaholoProcessResult{
    iterationIndex: Number;
    process: String;
    actions: [KaholoActionResult];
    status: String;
    message: any;
    preRunResult: any;
    postRunResult: any;
    startTime: String; 
    finishTime: String;
    id:String;
};



declare class KaholoAgentResult{
    agent:string;
    processes: [KaholoProcessResult]
}


declare class KaholoExecution{
    _id: String;
    id:String;
    agentsResults:[KaholoAgentResult];
    archivedMap:boolean;
    configuration: any;
    createdAt: string;
    map:string;
    runId:String;
    startTime :  String;
    status:String;
    structure:String;
    trigger:String;
    triggerPayload:any;
    finishTime: String;
    reason: String;
}



declare class KaholoStructure{

    createdAt: String;
    map: String;
    content: any;
    links: [KaholoLink];
    processes: [KaholoProcess];
    code: String;
    configurations: [KaholoConfiguration];
    used_plugins: [usedPluginsSchema]
}

declare class KaholoConfiguration{
    name:String;
    value:Object
}

declare class KaholoMap{
    name: String;
    description:String;
    archived: Boolean;
    agents: [String];
    groups: [String];
    queue: Number;
}
declare class MapsService {

    /**
    * @returns an array of the maps configurations
    */
    getMapConfigurations(): [KaholoConfiguration]

    /**
     * @param {Number} amount - the aount of results to return
     * @returns an array of the executions results
     */
    getMapExecutions(amount: Nunber): Promise<[KaholoExecution]>

    /**
     * @param {String} mapId 
     * @returns the latest map and map structure
     */
    getMap(mapId: String): Promise<{ map: KaholoMap, structure: KaholoStructure }>

}