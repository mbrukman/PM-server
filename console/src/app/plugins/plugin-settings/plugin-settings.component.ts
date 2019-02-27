import {Component,OnInit } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {PluginsService} from '@plugins/plugins.service'
import {Plugin} from '@plugins/models/plugin.model'
import { from, forkJoin, of } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';

@Component({
    selector: 'app-plugin-settings',
    templateUrl: './plugin-settings.component.html',
    styleUrls: ['./plugin-settings.component.scss']
})

export class PluginSettingsComponent implements OnInit{
    settingsForm: FormGroup = new FormGroup({});
    plugin = new Plugin();
    methods: object = {};
    paramOptionsDropDown = {};
    constructor(private route: ActivatedRoute,private pluginsService: PluginsService,private router:Router){}

    ngOnInit(){
        
        let pluginId = this.route.snapshot.params.id;
        this.pluginsService.getById(pluginId).subscribe(plugin =>{
            this.plugin = plugin;
            this.initSettingsForm();
            this.generateAutocompleteParams();
            for(let i=0,length=this.plugin.settings.length;i<length;i++){
                if(this.plugin.settings[i].options.length > 0){
                    let options = this.plugin.settings[i].options.map(opt => {
                        return {label:opt.name,value:opt.id}
                    })
                    this.paramOptionsDropDown[this.plugin.settings[i].name]=options;
                }
            }
        }) 
    }



    generateAutocompleteParams() {
        if (!this.plugin) return;
        from(this.plugin.settings).pipe(
            filter(param => param.valueType == 'autocomplete'), // check if has autocomplete
            mergeMap(param => {
                return forkJoin(of(param), // the param
                  this.pluginsService.generatePluginSettingsParams(this.plugin._id)
                   // generated params
                );
              })
        ).subscribe(data => {
                data[1].forEach(param => {
                    if(param.valueType == 'autocomplete'){
                        this.plugin.settings[this.plugin.settings.findIndex(p => p.name == param.name)] = param
                        
                    }
                })
            
        })
    }

    initSettingsForm() {
        let controls = {};
        this.plugin.settings.forEach(param => {
            controls[param.name] = new FormControl(param.value);
        })
        this.settingsForm = new FormGroup(controls);
       
    }

    onSubmitForm(value){
        this.pluginsService.updateSettings(this.plugin.id,value).subscribe(() => {
            this.router.navigate(['admin/plugins']);
          });
    }
}