import { describe, expect, it } from 'vitest';
import { summarizePeriodCalculations } from './periodCalculationSummary';

describe('summarizePeriodCalculations', () => {
    it('sums employee amounts in cents and combines payroll-record counts', () => {
        expect(summarizePeriodCalculations([
            {
                calculated_amount: 9670.63,
                total_payroll_periods: 20,
            },
            {
                calculated_amount: 8.34,
                total_payroll_periods: 2,
            },
        ], 2)).toEqual({
            total_employees: 2,
            calculated_amount: 9678.97,
            payroll_records: 22,
        });
    });
});
