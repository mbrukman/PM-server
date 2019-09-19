import { Subscription } from 'rxjs';


export class SubscriptionManager{
    subscriptions : Subscription[] = [];

    add(subscription){
        this.subscriptions.push(subscription)
    }

    unsubscribe(){
        this.subscriptions.forEach(subscription => {
            subscription.unsubscribe()
        })
    }
}