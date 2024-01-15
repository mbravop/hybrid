import { Injectable } from '@angular/core';

//Importe los módulos con la funcionalidad nativa
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
// Importa el módulo Platform y Capacitor
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

//Importe la interfaz
import { UserPhoto } from '../interfaces/user-photo';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  //Atributo para almacenar las fotos
  public photos: UserPhoto[] = [];
  //Referencia local a la plataforma utilizada 'hybrid' o 'web'
  private platform: Platform;
  //Clave para el almacenamiento
  private PHOTO_STORAGE: string = 'photos';

  //Referencia en la inyección de dependencias
  constructor(platform: Platform) {
    this.platform = platform;
  }
  public async addNewToGallery() {
    // Tome una foto
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });
    // Agregue el archivo al inicio del arreglo
    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
    // Agregue el archivo al inicio del arreglo
    // this.photos.unshift({
    //   filepath: "soon...",
    //   webviewPath: capturedPhoto.webPath!
    // });

  }
  private async savePicture(photo: Photo) {
    // Convierta la foto al formato base64, requerido por el API para guardar en el sistema de archivos
    const base64Data = await this.readAsBase64(photo);

    // Escriba el archivo en el directorio de datos.
    const fileName = Date.now() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });
    if (this.platform.is('hybrid')) {
      // Muestre la nueva imagen reescribiendo la ruta 'file://' a HTTP
      // Detalles: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    }
    else {

      // Utilice webPath para mostrar la nueva imagen en lugar de base64 ya que 
      // ya está cargada en la memoria
      return {
        filepath: fileName,
        webviewPath: photo.webPath
      };

    }
  }
  private async readAsBase64(photo: Photo) {

    // "hybrid" detecta si es Cordova o Capacitor
    if (this.platform.is('hybrid')) {
      // Lee el archivo en formato base64
      const file = await Filesystem.readFile({
        path: photo.path!
      });

      return file.data;
    }
    else {
      // Obtenga la foto, léala como un blob y luego conviértala al formato base64.
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();

      return await this.convertBlobToBase64(blob) as string;
    }
  }

  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
  
  public async loadSaved() {

    // Recuperar datos del arreglo de fotografías en caché
    const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];


    // La forma más sencilla de detectar cuando se ejecuta en la web:
    // “cuando la plataforma NO sea híbrida, haz esto”
    if (!this.platform.is('hybrid')) {

      // Muestra la foto leyendo en formato base64
      for (let photo of this.photos) {

        // Lee los datos de cada foto guardada desde el sistema de archivos
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
        });

        // Solo plataforma web: carga la foto como datos base64
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }
}
