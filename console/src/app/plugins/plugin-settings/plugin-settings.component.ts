import {Component,OnInit,OnDestroy } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {PluginsService} from '@plugins/plugins.service'
import {Plugin} from '@plugins/models/plugin.model'
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/observable/of';
import { Observable } from 'rxjs/Observable';
import { PluginMethod } from '@plugins/models/plugin-method.model';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
@Component({
    selector: 'app-plugin-settings',
    templateUrl: './plugin-settings.component.html',
    styleUrls: ['./plugin-settings.component.scss']
})

export class PluginSettingsComponent implements OnInit,OnDestroy{
    settingsForm: FormGroup = new FormGroup({});
    plugin = new Plugin();
    methods: object = {};
    options:any = []
    constructor(private route: ActivatedRoute,private pluginsService: PluginsService,private router:Router){}

    ngOnInit(){
        
        let pluginId = this.route.snapshot.params.id
        this.pluginsService.list().subscribe(plugins => {
            this.plugin = plugins.find(p => p.id == pluginId);
            this.initSettingsForm();
            this.generateAutocompleteParams()
            
        }) 
    }

    generateAutocompleteParams() {
        if (!this.plugin) return;
        Observable.from(this.plugin.settings)
          .filter(param => param.valueType == 'autocomplete') // check if has autocomplete
          .flatMap(param => {
            return Observable.forkJoin(
              Observable.of(param), // the param
              this.pluginsService.generatePluginSettingsParams(this.plugin._id)
               // generated params
            );
          })
          .subscribe(data => {
                data[1].forEach(param => {
                    if(param.valueType == 'autocomplete'){
                        this.plugin.settings[this.plugin.settings.findIndex(p => p.name == param.name)] = param
                    }
                })
            
        })
            
        
    }

    methodHaveParamType(method: PluginMethod, type: string): boolean {
        return method.params.findIndex(p => p.type === type) > -1;
    }

    addToMethodContext(method) {
        this.methods[method.name] = method;
        for(let i =0,length=method.params.length;i<length;i++){
            if(method.params[i].type == 'autocomplete'){
                for(let j = 0, length = method.params[i].options.length;j<length;j++){
                    this.options.push(method.params[i].options[j])
                }
            }
        }
        console.log(this.options)
      }
      

    ngOnDestroy(){

    }

    initSettingsForm() {
        let controls = {};
        this.plugin.settings.forEach(param => {
            controls[param.name] = new FormControl();
        })
        this.settingsForm = new FormGroup(controls);
    }

    onSubmitForm(value){
        this.pluginsService.addSettings(this.plugin.id,value).subscribe(() => {
            this.router.navigate(['admin/plugins']);
          });
    }
}