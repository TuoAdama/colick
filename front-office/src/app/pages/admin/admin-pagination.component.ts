import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-admin-pagination',
  standalone: true,
  template: `
    <nav aria-label="Pagination" class="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p>{{ totalElements() }} résultat(s) · Page {{ page() + 1 }} sur {{ totalPages() || 1 }}</p>
      <div class="flex gap-2">
        <button type="button" class="rounded-xl border border-border px-4 py-2 disabled:opacity-40" [disabled]="page() === 0" (click)="pageChange.emit(page() - 1)">Précédent</button>
        <button type="button" class="rounded-xl border border-border px-4 py-2 disabled:opacity-40" [disabled]="page() + 1 >= totalPages()" (click)="pageChange.emit(page() + 1)">Suivant</button>
      </div>
    </nav>
  `,
})
export class AdminPaginationComponent {
  page = input.required<number>();
  totalPages = input.required<number>();
  totalElements = input.required<number>();
  pageChange = output<number>();
}
