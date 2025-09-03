import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UIModule } from '../../shared/ui/ui.module';
import {
  NgbAlertModule, NgbCarouselModule, NgbDropdownModule, NgbModalModule, NgbProgressbarModule,
  NgbTooltipModule, NgbPopoverModule, NgbPaginationModule, NgbNavModule, NgbAccordionModule,
  NgbCollapseModule, NgbRatingModule, NgbToastModule
} from '@ng-bootstrap/ng-bootstrap';
import { NgxSliderModule } from 'ngx-slider-v2';

// Masonry
import { NgxMasonryModule } from 'ngx-masonry';

import { LightboxModule } from 'ngx-lightbox';

import { UiRoutingModule } from './ui-routing.module';

import { AlertsComponent } from './alerts/alerts.component';
import { ButtonsComponent } from './buttons/buttons.component';
import { CardsComponent } from './cards/cards.component';
import { CarouselComponent } from './carousel/carousel.component';
import { DropdownsComponent } from './dropdowns/dropdowns.component';
import { GridComponent } from './grid/grid.component';
import { ImagesComponent } from './images/images.component';
import { ModalsComponent } from './modals/modals.component';
import { ProgressbarComponent } from './progressbar/progressbar.component';
import { TypographyComponent } from './typography/typography.component';
import { GeneralComponent } from './general/general.component';
import { ColorsComponent } from './colors/colors.component';
import { VideoComponent } from './video/video.component';
import { TabsComponent } from './tabs/tabs.component';
import { SweetalertComponent } from './sweetalert/sweetalert.component';
import { RangesliderComponent } from './rangeslider/rangeslider.component';
import { RatingComponent } from './rating/rating.component';
import { PlaceholdersComponent } from './placeholders/placeholders.component';
import { LightboxComponent } from './lightbox/lightbox.component';
import { OffcanvasComponent } from './offcanvas/offcanvas.component';
import { UtilitiesComponent } from './utilities/utilities.component';
import { ToastsComponent } from './toasts/toasts.component';

import { ToastsContainer } from './toasts/toasts-container.component';

@NgModule({
  // tslint:disable-next-line: max-line-length
  declarations: [
    AlertsComponent, 
    ButtonsComponent, 
    CardsComponent, 
    CarouselComponent, 
    DropdownsComponent, 
    GridComponent, 
    ImagesComponent, 
    ModalsComponent, 
    ProgressbarComponent, 
    TypographyComponent, 
    GeneralComponent, 
    ColorsComponent, 
    VideoComponent, 
    TabsComponent, 
    SweetalertComponent, 
    RangesliderComponent, 
    RatingComponent, 
    PlaceholdersComponent, 
    LightboxComponent, 
    OffcanvasComponent, 
    UtilitiesComponent, 
    ToastsComponent,
    ToastsContainer
  ],
  imports: [
    CommonModule,
    UiRoutingModule,
    UIModule,
    FormsModule,
    ReactiveFormsModule,
    NgxSliderModule,
    NgxMasonryModule,
    LightboxModule,
    NgbAlertModule,
    NgbCarouselModule,
    NgbDropdownModule,
    NgbModalModule,
    NgbProgressbarModule,
    NgbTooltipModule,
    NgbPopoverModule,
    NgbPaginationModule,
    NgbNavModule,
    NgbAccordionModule,
    NgbCollapseModule,
    NgbRatingModule,
    NgbToastModule
  ]
})
export class UiModule { }
