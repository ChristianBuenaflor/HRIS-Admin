import { describe, expect, it } from "vitest";
import { collectEmployeePages } from "./api";
import type { Employee } from "./types";

const employee = (id: number): Employee => ({
  id,
  employee_id: `EMP-${id}`,
  first_name: "Employee",
  last_name: String(id),
  is_active: 1,
  is_archived: 0,
});

describe("collectEmployeePages", () => {
  it("loads every employee page", async () => {
    const requestedPages: number[] = [];

    const employees = await collectEmployeePages(async (page) => {
      requestedPages.push(page);

      if (page === 1) {
        return {
          employees: [employee(1), employee(2)],
          pagination: { last_page: 2 },
        };
      }

      return {
        employees: [employee(3)],
        pagination: { last_page: 2 },
      };
    });

    expect(employees.map(({ id }) => id)).toEqual([1, 2, 3]);
    expect(requestedPages).toEqual([1, 2]);
  });

  it("deduplicates employees that appear on more than one page", async () => {
    const employees = await collectEmployeePages(async (page) => ({
      employees:
        page === 1
          ? [employee(1), employee(2)]
          : [employee(2), employee(3)],
      pagination: { last_page: 2 },
    }));

    expect(employees.map(({ id }) => id)).toEqual([1, 2, 3]);
  });

  it("does not request extra pages when pagination is missing", async () => {
    let requests = 0;

    const employees = await collectEmployeePages(async () => {
      requests += 1;
      return { employees: [employee(1)] };
    });

    expect(employees).toHaveLength(1);
    expect(requests).toBe(1);
  });
});
