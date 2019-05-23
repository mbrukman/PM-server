import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'

/** Pass untouched request through to the next request handler. */
@Injectable()
export class KaholoHttpInterceptor implements HttpInterceptor {

    intercept(req: HttpRequest<any>, next: HttpHandler):
        Observable<HttpEvent<any>> {
        const fullUrlReq = req.clone({ url: environment.serverUrl + req.url });
        return next.handle(fullUrlReq);
    }
}