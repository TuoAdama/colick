import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, startWith } from 'rxjs';

export type AdminRequest<T> =
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'ready'; data: T };

export function adminRequest<T>(request: Observable<T>, errorMessage: string, notFound?: string): Observable<AdminRequest<T>> {
  return request.pipe(
    map((data): AdminRequest<T> => ({ state: 'ready', data })),
    catchError((error: HttpErrorResponse) => of<AdminRequest<T>>({
      state: 'error', message: error.status === 404 && notFound ? notFound : errorMessage,
    })),
    startWith<AdminRequest<T>>({ state: 'loading' }),
  );
}

export function adminPageIndex(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 0 && page <= 2_147_483_647 ? page : 0;
}

export function adminTripSortParam(value: string | null): 'created_asc' | null {
  return value === 'created_asc' ? value : null;
}
