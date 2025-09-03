import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GoogleMapsModule } from '@angular/google-maps';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';

import { UIModule } from '../../shared/ui/ui.module';

import { MapsRoutingModule } from './maps-routing.module';
import { GoogleComponent } from './google/google.component';
import { LeafletComponent } from './leaflet/leaflet.component';

@NgModule({
  declarations: [GoogleComponent, LeafletComponent],
  imports: [
    CommonModule,
    MapsRoutingModule,
    UIModule,
    GoogleMapsModule,
    LeafletModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MapsModule { }
