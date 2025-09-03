import { Component } from '@angular/core';
import { Lightbox } from 'ngx-lightbox';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-lightbox',
  templateUrl: './lightbox.component.html',
  styleUrls: ['./lightbox.component.scss']
})
export class LightboxComponent {

  // bread crumb items
  breadCrumbItems: Array<{}>;
  images = [];
  albums = [];
  gallery = [];

  constructor(private lightbox: Lightbox, private modalService: NgbModal) {
    for (let i = 1; i <= 1; i++) {
      const src = '../../../assets/images/small/img-' + i + '.jpg';
      const caption = 'Image ' + i + ' caption here';
      const thumb = '../../../assets/images/small/img-' + i + '.jpg';
      const album = {
        src,
        caption,
        thumb
      };
      this.images.push(album);
    }

    for (let i = 1; i <= 6; i++) {
      const src = '../../../assets/images/small/img-' + i + '.jpg';
      const caption = 'Image ' + i + ' caption here';
      const thumb = '../../../assets/images/small/img-' + i + '.jpg';
      const album = {
        src,
        caption,
        thumb
      };
      this.albums.push(album);
    }

    for (let i = 3; i <= 4; i++) {
      const src = '../../../assets/images/small/img-' + i + '.jpg';
      const caption = 'Image ' + i + ' caption here';
      const thumb = '../../../assets/images/small/img-' + i + '.jpg';
      const album = {
        src,
        caption,
        thumb
      };
      this.gallery.push(album);
    }
  }

  ngOnInit(): void {
    this.breadCrumbItems = [{ label: 'UI Elements' }, { label: 'Lightbox', active: true }];
  }

   /**
   * Open lightbox
   */
   openImage(index: number): void {
    // open lightbox
    this.lightbox.open(this.images, index, {
      showZoom: true
    });
  }

  /**
   * Open lightbox
   */
  open(index: number): void {
    // open lightbox
    this.lightbox.open(this.albums, index);
  }

  /**
   * Open ZoomGallery lightbox
   */
  openZoomGallery(index: number): void {
    // open lightbox
    this.lightbox.open(this.gallery, index, {
      wrapAround: true, showImageNumberLabel: true
    });
  }

   /**
   * Open modal
   * @param content modal content
   */
   openYoutubeModal(content: any) {
    this.modalService.open(content, { size: 'lg', windowClass: 'modal-holder', centered: true });
  }

  /**
   * Open modal
   * @param content modal content
   */
  openModal(content: any) {
    this.modalService.open(content, { size: 'lg', centered: true });
  }

}
