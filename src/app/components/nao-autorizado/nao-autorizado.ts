import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
	selector: 'app-nao-autorizado',
	imports: [],
	templateUrl: './nao-autorizado.html',
	styleUrl: './nao-autorizado.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NaoAutorizado {
	private readonly router = inject(Router);

	voltarParaDashboard(): void {
		void this.router.navigate(['/dashboard']);
	}
}
