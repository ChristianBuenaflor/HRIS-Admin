export interface EmployeeCalculationTotals {
    calculated_amount: number;
    total_payroll_periods: number;
}

export interface PeriodCalculationSummary {
    total_employees: number;
    calculated_amount: number;
    payroll_records: number;
}

export function summarizePeriodCalculations(
    calculations: EmployeeCalculationTotals[],
    totalEmployees: number
): PeriodCalculationSummary {
    let calculatedAmountCents = 0;
    let payrollRecords = 0;

    calculations.forEach((calculation) => {
        calculatedAmountCents += Math.round(calculation.calculated_amount * 100);
        payrollRecords += calculation.total_payroll_periods;
    });

    return {
        total_employees: totalEmployees,
        calculated_amount: calculatedAmountCents / 100,
        payroll_records: payrollRecords,
    };
}
