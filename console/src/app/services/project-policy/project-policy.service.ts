import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProjectPolicy } from './project-policy.interface';

@Injectable({
  providedIn: 'root'
})
export class ProjectPolicyService {

  constructor(private http: HttpClient) {
  }

  updateProjectPolicy(projectPolicy: ProjectPolicy): Observable<ProjectPolicy> {
    return this.http.patch<ProjectPolicy>(`api/project-policies/${projectPolicy._id}`, projectPolicy);
  }
}
