import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import config from 'devextreme/core/config';
import { licenseKey } from './devextreme-license'; // este archivo está en /src

config({ licenseKey } as any); // <-- forma correcta para Angular

if (environment.production) {
  enableProdMode();
}
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
