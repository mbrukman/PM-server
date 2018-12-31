export class PluginSettings  {
    id?: string;
    _id?: string;
    name: string;
    valueType?: string;
    viewName?: string;
    options?: [{ id: string, name: string }];
    value?: string | { id: string, value: string } = null;
}
