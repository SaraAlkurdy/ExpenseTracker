import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Currency {
  private readonly API_KEY =
    'cur_live_R8PVCstAp0wNqrzSvQmqL4Vd2MZhfWaZ4EucXXsu';
  private readonly BASE_URL = 'https://api.currencyapi.com/v3';
  private supportedCurrencies: string[] = ['USD', 'EUR', 'GBP', 'JPY', 'CAD']; // Fallback currencies
  private cachedRates: Record<string, number> = {};

  constructor(private http: HttpClient) {}

  /**
   * Get all available currencies
   */
  getCurrencies(): Observable<string[]> {
    const url = `${this.BASE_URL}/currencies`;

    return this.http
      .get<any>(url, {
        headers: { apikey: this.API_KEY },
      })
      .pipe(
        map((response) => {
          if (response.data) {
            this.supportedCurrencies = Object.keys(response.data);
            return this.supportedCurrencies;
          }
          throw new Error('No currency data received');
        }),
        catchError((error) => {
          console.error('Error fetching currencies:', error);
          return of(this.supportedCurrencies); // Return fallback currencies
        })
      );
  }

  /**
   * Get exchange rates for a specific date (defaults to latest)
   */
  getRates(
    date?: string,
    baseCurrency: string = 'USD'
  ): Observable<Record<string, number>> {
    const endpoint = date ? 'historical' : 'latest';
    const url = `${this.BASE_URL}/${endpoint}?base_currency=${baseCurrency}${
      date ? `&date=${date}` : ''
    }`;

    return this.http
      .get<any>(url, {
        headers: { apikey: this.API_KEY },
      })
      .pipe(
        map((response) => {
          this.cachedRates = {};
          Object.entries(response.data).forEach(
            ([code, data]: [string, any]) => {
              this.cachedRates[code] = data.value;
            }
          );
          return this.cachedRates;
        }),
        catchError((error) => {
          console.error('Error fetching exchange rates:', error);
          return of(this.cachedRates);
        })
      );
  }

  /**
   * Get latest exchange rates
   * @param baseCurrency Base currency (default: USD)
   */
  getLatestRates(
    baseCurrency: string = 'USD'
  ): Observable<Record<string, number>> {
    const url = `${this.BASE_URL}/latest?base_currency=${baseCurrency}`;

    return this.http
      .get<any>(url, {
        headers: { apikey: this.API_KEY },
      })
      .pipe(
        map((response) => {
          const rates: Record<string, number> = {};
          Object.entries(response.data).forEach(
            ([code, data]: [string, any]) => {
              rates[code] = data.value;
            }
          );
          return rates;
        }),
        catchError((error) => {
          console.error('Error fetching exchange rates:', error);
          return of({});
        })
      );
  }

  /**
   * Convert amount between currencies using cached rates
   */
  convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string = 'USD'
  ): Observable<number> {
    if (fromCurrency === toCurrency) {
      return of(amount);
    }

    // If we have cached rates, use them
    if (this.cachedRates[fromCurrency] && this.cachedRates[toCurrency]) {
      const converted =
        amount *
        (this.cachedRates[toCurrency] / this.cachedRates[fromCurrency]);
      return of(converted);
    }

    // Otherwise fetch fresh rates
    return this.getRates(undefined, fromCurrency).pipe(
      map((rates) => {
        if (rates[toCurrency]) {
          return amount * rates[toCurrency];
        }
        throw new Error('Conversion rate not available');
      }),
      catchError(() => {
        console.warn('Using fallback conversion rate');
        // Very rough fallback rates
        const fallbackRates: Record<string, number> = {
          EUR: 0.85,
          GBP: 0.75,
          JPY: 110,
          CAD: 1.25,
          AUD: 1.35,
        };
        const rate = fallbackRates[toCurrency] || 1;
        return of(amount * rate);
      })
    );
  }

  /**
   * Convert multiple expenses to base currency (USD)
   * @param expenses Array of expenses with different currencies
   */
  convertExpensesToUSD(expenses: any[]): Observable<any[]> {
    // Group by currency to minimize API calls
    const currencies = [...new Set(expenses.map((e) => e.currency))];
    const conversionRequests = currencies
      .filter((c) => c !== 'USD')
      .map((currency) => this.getLatestRates(currency));

    if (conversionRequests.length === 0) {
      return of(expenses);
    }
    return forkJoin(conversionRequests).pipe(
      map((ratesArray) => {
        const rates = Object.assign({}, ...ratesArray);
        return expenses.map((expense) => {
          if (expense.currency === 'USD') {
            return { ...expense, convertedAmount: expense.amount };
          }
          const rate = rates['USD'] || 1;
          return {
            ...expense,
            convertedAmount: expense.amount * rate,
          };
        });
      })
    );
  }
}
