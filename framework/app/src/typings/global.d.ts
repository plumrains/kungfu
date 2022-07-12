import { Subject } from 'rxjs';
import { StoreDefinition } from 'pinia';
import { GlobalCategoryRegister } from '@kungfu-trader/kungfu-js-api/utils/extraLocationUtils';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $globalBus: Subject<KfBusEvent>;
    $tradingDataSubject: Subject<Watcher>;
    $globalCategoryRegister: GlobalCategoryRegister;
    $availKfBoards: string[];
  }
}

declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

export {};
