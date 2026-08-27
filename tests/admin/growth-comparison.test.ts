import assert from "node:assert/strict";
import test from "node:test";
import { formatGrowthComparison } from "../../lib/admin/growth-comparison";

test("growth comparison formats increases decreases and a new baseline", () => {
  assert.equal(formatGrowthComparison([
    { label: "คลิก", current: 120, previous: 100 },
    { label: "เซสชัน", current: 75, previous: 100 },
  ]), "คลิก +20.0% · เซสชัน -25.0%");
  assert.equal(formatGrowthComparison([{ label: "ผู้ใช้งาน", current: 3, previous: 0 }]), "ผู้ใช้งาน เริ่มมีข้อมูล");
  assert.equal(formatGrowthComparison([{ label: "ผู้ใช้งาน", current: 0, previous: 0 }]), null);
});
