import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  adminDataLaneLabel,
  contentReviewStatusLabel,
  connectionLabel,
  environmentLabel,
  friendlyApiError,
  friendlyApiErrorFromPayload,
  proposalStatusLabel,
  riskLabel,
  roleLabel,
} from "../../lib/admin/presentation";

test("admin presentation uses friendly Thai labels and hides unknown API detail", () => {
  assert.equal(roleLabel("owner"), "เจ้าของระบบ");
  assert.equal(proposalStatusLabel("needs-human-review"), "รอคุณตรวจสอบ");
  assert.equal(contentReviewStatusLabel("drafting"), "กำลังเขียน");
  assert.equal(contentReviewStatusLabel("content-review"), "กำลังตรวจเนื้อหา");
  assert.equal(contentReviewStatusLabel("fact-check"), "กำลังตรวจข้อเท็จจริง");
  assert.equal(contentReviewStatusLabel("compliance-review"), "กำลังตรวจข้อกำหนดและกฎหมาย");
  assert.equal(contentReviewStatusLabel("ready-for-coo"), "พร้อมให้คุณอนุมัติ");
  assert.equal(contentReviewStatusLabel("approved"), "อนุมัติเนื้อหาแล้ว");
  assert.equal(contentReviewStatusLabel(null), "ยังไม่มีข้อมูลการตรวจ");
  assert.equal(contentReviewStatusLabel("future-status"), "ไม่รู้จักขั้นตรวจนี้");
  assert.equal(riskLabel("critical"), "วิกฤต — ตรวจใน Studio");
  assert.equal(connectionLabel(false, "write"), "ปิดการบันทึกไว้เพื่อความปลอดภัย");
  assert.equal(environmentLabel("uat"), "ระบบทดสอบ UAT");
  assert.equal(environmentLabel("admin-uat"), "ระบบหลังบ้าน UAT");
  assert.equal(environmentLabel("local-uat"), "Local UAT บน Mac");
  assert.equal(environmentLabel("local-production"), "Local Production บน Mac (ข้อมูลจริง)");
  assert.equal(environmentLabel("production-admin"), "ระบบหลังบ้าน Production (ข้อมูลจริง)");
  assert.equal(adminDataLaneLabel("production-admin"), "Production Draft (ข้อมูลจริง)");
  assert.equal(adminDataLaneLabel("local-uat"), "UAT");
  assert.equal(adminDataLaneLabel("local-production"), "Production Draft (ข้อมูลจริง)");
  assert.equal(connectionLabel(true, "read", "local-production"), "อ่านข้อมูล Production ได้");
  assert.equal(connectionLabel(true, "studio", "local-production"), "แก้ฉบับร่าง Production ใน Studio ได้");
  assert.equal(connectionLabel(false, "studio", "local-production"), "ปิดการแก้ฉบับร่างไว้เพื่อความปลอดภัย");
  assert.equal(friendlyApiError("suggestion-conflict"), "บทความหรือข้อเสนอเปลี่ยนไปแล้ว กรุณาโหลดหน้าใหม่และตรวจอีกครั้ง");
  assert.equal(friendlyApiError("suggestion-stale"), "ฉบับร่างเปลี่ยนหลังจากอนุมัติข้อเสนอนี้ กรุณาตรวจ SEO และสร้างข้อเสนอใหม่");
  assert.equal(friendlyApiError("raw-provider-secret-detail"), "ระบบยังทำรายการนี้ไม่สำเร็จ กรุณาลองอีกครั้ง");
  assert.equal(friendlyApiErrorFromPayload({ error: "forbidden", reason: "raw internal detail" }), "บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้");
});

test("content list separates document state from content review state", () => {
  const contentPage = readFileSync("app/snt-admin/(protected)/content/page.tsx", "utf8");
  const sanityControl = readFileSync("lib/admin/sanity-control.ts", "utf8");
  assert.match(contentPage, /สถานะเอกสาร/);
  assert.match(contentPage, /ขั้นตรวจเนื้อหา/);
  assert.match(contentPage, /เผยแพร่แล้ว · มีฉบับร่างแก้ไข/);
  assert.match(contentPage, /runSeoAudit\(article\.id, false\)/);
  assert.match(contentPage, /คำนวณจากฉบับปัจจุบัน · ยังไม่บันทึก/);
  assert.match(contentPage, /ดูรายละเอียดผลตรวจ/);
  assert.match(contentPage, /เผยแพร่ครั้งแรก/);
  assert.match(sanityControl, /requireReadClient\("published"\)/);
  assert.match(sanityControl, /hasPublished/);
  assert.doesNotMatch(contentPage, /ฉบับร่าง ·/);
});
