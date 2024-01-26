import { HttpInterceptorFn } from '@angular/common/http';

export const notadexRequestInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('restdb')) {
    req = req.clone({
      setHeaders: {
        'cache-control': 'no-cache',
        'x-apikey': '65b27b85bc72c1c6a572b7d4',
        'Content-Type': 'application/json',
      },
    });
  }

  return next(req);
};
