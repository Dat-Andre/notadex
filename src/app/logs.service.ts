import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LogsService {
  constructor(private http: HttpClient) {}

  postLog(
    process_stage: string,
    walletAddress?: string,
    errorObject?: any
  ): Observable<any> {
    return this.http.post<any>('https://notadex-1cde.restdb.io/rest/logs', {
      process_stage: process_stage,
      log_level: 'Error',
      raw_log: errorObject ? errorObject : null,
      date_time: new Date(),
      wallet_address: walletAddress ? walletAddress : null,
    });
  }
}
