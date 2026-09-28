import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export enum BudgetExpenseCategory {
	Custo = 0,
	Despesa = 1,
}

export interface Budget {
	id: string;
	projectId: string;
	projectName?: string | null;
	totalAmount: number;
	currency: string;
	startDate: string;
	endDate: string;
	discountRateMonthly: number;
	expectedReturn: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateBudgetDto {
	projectId: string;
	totalAmount: number;
	currency: string;
	startDate: string;
	endDate: string;
	discountRateMonthly: number;
	expectedReturn: number;
}

export interface UpdateBudgetDto {
	totalAmount: number;
	currency: string;
	startDate: string;
	endDate: string;
	discountRateMonthly: number;
	expectedReturn: number;
}

export interface BudgetExpense {
	id: string;
	budgetId: string;
	description: string;
	category: BudgetExpenseCategory;
	amount: number;
	date: string;
	createdAt?: string;
}

export interface CreateBudgetExpenseDto {
	description: string;
	category: BudgetExpenseCategory;
	amount: number;
	date: string;
}

export interface BudgetMetrics {
	budgetId: string;
	totalBudget: number;
	totalSpent: number;
	remainingBudget: number;
	percentSpent: number;
	netPresentValue: number;
	burnRateMonthly: number;
	burnRatePercent: number;
	monthsElapsed: number;
	monthsRemaining: number;
	projectedDepletionDate?: string | null;
	isOverBudgetRisk: boolean;
}

@Injectable({
	providedIn: 'root',
})
export class BudgetService {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = `${environment.apiUrl}/Budgets`;

	getBudgetByProject(projectId: string): Observable<Budget> {
		return this.http.get<Budget>(`${this.baseUrl}/project/${projectId}`);
	}

	createBudget(budget: CreateBudgetDto): Observable<Budget> {
		return this.http.post<Budget>(this.baseUrl, budget);
	}

	updateBudget(id: string, budget: UpdateBudgetDto): Observable<void> {
		return this.http.put<void>(`${this.baseUrl}/${id}`, budget);
	}

	getExpenses(budgetId: string): Observable<BudgetExpense[]> {
		return this.http.get<BudgetExpense[]>(`${this.baseUrl}/${budgetId}/expenses`);
	}

	createExpense(budgetId: string, expense: CreateBudgetExpenseDto): Observable<BudgetExpense> {
		return this.http.post<BudgetExpense>(`${this.baseUrl}/${budgetId}/expenses`, expense);
	}

	deleteExpense(expenseId: string): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/expenses/${expenseId}`);
	}

	getBudgetMetrics(budgetId: string): Observable<BudgetMetrics> {
		return this.http.get<BudgetMetrics>(`${this.baseUrl}/${budgetId}/metrics`);
	}
}
