import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { fadeInUpAnimation } from 'src/app/core/animations/fade-in-up.animation';

@Component({
  selector: 'app-registrar',
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
  animations: [fadeInUpAnimation],
})
export class RegistrarComponent implements OnInit {

  constructor(private route:Router){

  }

  ngOnInit(): void {
      
  }

  cancelar(){
    this.route.navigateByUrl('/bluevox/lista-bluevox')
  }

}
