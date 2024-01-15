import { Component } from '@angular/core';
// Importe el módulo con la directiva @ngFor
import { CommonModule } from '@angular/common'
import { IonHeader, IonToolbar, IonTitle, IonContent , IonFab, IonFabButton, IonIcon, IonImg, IonCol, IonRow, IonGrid} from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';

//Importe el servicio
import { PhotoService } from '../services/photo.service';
@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent, CommonModule, IonFab, IonFabButton, IonIcon, IonImg, IonCol, IonRow, IonGrid]
})
export class Tab2Page {
//Inyecte la dependencia del servicio
	constructor(public photoService: PhotoService) {}
  async ngOnInit() {
    await this.photoService.loadSaved();
  }
	//Método a invocar
	addPhotoToGallery() {
		this.photoService.addNewToGallery();
	}

}
