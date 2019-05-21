import {Component,OnInit } from '@angular/core'
import { FormControl, FormGroup, FormArray,Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {PluginsService} from '@plugins/plugins.service'
import {Plugin} from '@plugins/models/plugin.model'
import {SeoService,PageTitleTypes} from '@app/seo.service';

@Component({
    selector: 'app-plugin-settings',
    templateUrl: './plugin-settings.component.html',
    styleUrls: ['./plugin-settings.component.scss']
})

export class PluginSettingsComponent implements OnInit{
    settingsForm: FormGroup = new FormGroup({});
    plugin = new Plugin();
    methods: object = {};
    constructor(private route: ActivatedRoute,private pluginsService: PluginsService,private router:Router,private seoService:SeoService){}

    ngOnInit(){
        
        let pluginId = this.route.snapshot.params.id;
        this.pluginsService.getById(pluginId).subscribe(plugin =>{
            this.plugin = plugin;
            this.initSettingsForm();
            this.seoService.setTitle(plugin.name+PageTitleTypes.Settings)
        }) 
        
    }

    initParamsForm(value, type, viewName) {
        return new FormGroup({
          value: new FormControl(value),
          type: new FormControl(type, Validators.required),
          viewName: new FormControl(viewName, Validators.required),
        });
      }

    initSettingsForm() {
        this.settingsForm = new FormGroup({
            params:new FormArray([])
        })
        let paramsControl = <FormArray>this.settingsForm.controls['params'];
        this.plugin.settings.forEach(param => {
            paramsControl.push(this.initParamsForm(param.value,param.valueType,param.viewName))
        })
    }

    onSubmitForm(value){
        this.pluginsService.updateSettings(this.plugin.id,value.params).subscribe(() => {
            this.router.navigate(['admin/plugins']);
          });
    }
}