import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router'; // <-- Adicionado RouterModule

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule], // <-- Adicionado aqui também
  templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'Lingol';
}