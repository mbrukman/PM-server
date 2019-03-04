import { NgxMonacoEditorConfig } from 'ngx-monaco-editor';
import { env } from '@shared/constants'

export const monacoConfig: NgxMonacoEditorConfig = {
  defaultOptions: { scrollBeyondLastLine: false }, // pass default options to be used
  onMonacoLoad: function(){
    console.log((<any>window).monaco); // here monaco object will be available as window.monaco use this function to extend monaco editor functionality.

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false
    });

    // compiler options
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2016,
      allowNonTsExtensions: true
    });

    // extra libraries
    monaco.languages.typescript.javascriptDefaults.addExtraLib(env.default.sdk, 'kaholo/sdk.d.ts');
  }
};
