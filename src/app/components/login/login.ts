import { Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Mail, Lock, Eye, EyeOff } from 'lucide-angular';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true,
})
export class Login {
  onLogin = output<void>();

  email = '';
  password = '';
  showPassword = false;

  handleSubmit() {
    this.onLogin.emit();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
