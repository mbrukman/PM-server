
declare class KaholoTrigger {
    msg: string;
    payload: any;
}

declare class KaholoAction {
    server: {type: string,name: string,id: string};
    method: {
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
    params:object;
    name: string;
    timeout:number;
    timeunit:number;
    retries:number;
    mandatory:boolean;
    suspend:boolean;
    result:string;
    status:number;
    id:number;
    order:number;
    lastUpdate:number
}

declare class KaholoProcess{
    id: number;
    name: string;
    description: string;
    order: number;
    default_execution: boolean;
    mandatory: boolean;
    actions: [KaholoAction];
    result: string;
}

declare class KaholoLink{
    id: string;
    sourceId: string;
    targetId: string;
    processes: [KaholoProcess];
    result: string;
    linkIndex: 0
}