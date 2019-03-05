/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

declare module "*.json" {
  const libEnv: any;
  export default libEnv;
}

