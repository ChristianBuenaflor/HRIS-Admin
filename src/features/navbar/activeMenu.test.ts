import { describe, expect, it } from "vitest";
import { isMenuActive } from "./activeMenu";

describe("isMenuActive", () => {
  it("activates only the item for the current route", () => {
    expect(isMenuActive("/employees", "/employees")).toBe(true);
    expect(isMenuActive("/employees", "/dashboard")).toBe(false);
  });

  it("keeps a parent item active on nested routes", () => {
    expect(isMenuActive("/employees/123", "/employees")).toBe(true);
    expect(isMenuActive("/employees-archive", "/employees")).toBe(false);
  });

  it("ignores trailing slashes", () => {
    expect(isMenuActive("/employees/", "/employees")).toBe(true);
    expect(isMenuActive("/employees", "/employees/")).toBe(true);
  });

  it("supports aliases such as Setup Manager pages under /setup", () => {
    expect(isMenuActive("/setup/initial", "/setup-manager", "/setup")).toBe(true);
    expect(isMenuActive("/setup-other", "/setup-manager", "/setup")).toBe(false);
  });
});
