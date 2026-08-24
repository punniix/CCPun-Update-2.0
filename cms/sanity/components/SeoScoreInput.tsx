"use client";

import type { ObjectInputProps } from "sanity";
import { useFormValue } from "sanity";
import { Badge, Card, Flex, Stack, Text } from "@sanity/ui";

type SeoValue = {
  title?: string;
  description?: string;
  focusKeyword?: string;
  searchIntent?: string;
  semanticTopic?: string;
  canonical?: string;
  noindex?: boolean;
  auditSnapshot?: {
    score?: number;
    criticalIssues?: number;
    warnings?: number;
    passedChecks?: number;
    auditedAt?: string;
  };
};

type ReferenceValue = { _ref?: string };
type ImageValue = { asset?: { _ref?: string } };
type MigratedImageValue = { src?: string };

function formatDate(value?: string) {
  if (!value) return "ไม่ทราบเวลา";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

function statusLabel(ok: boolean) {
  return ok ? "พร้อม" : "ควรตรวจ";
}

export default function SeoScoreInput(props: ObjectInputProps<SeoValue>) {
  const snapshot = props.value?.auditSnapshot;
  const score = snapshot?.score;
  const tone = score == null ? "default" : score >= 85 ? "positive" : score >= 70 ? "primary" : score >= 50 ? "caution" : "critical";

  const articleTitle = useFormValue(["title"]) as string | undefined;
  const slug = useFormValue(["slug", "current"]) as string | undefined;
  const publishedAt = useFormValue(["publishedAt"]) as string | undefined;
  const author = useFormValue(["author"]) as ReferenceValue | undefined;
  const featuredImage = useFormValue(["featuredImage"]) as ImageValue | undefined;
  const migratedFeaturedImage = useFormValue(["migratedFeaturedImage"]) as MigratedImageValue | undefined;
  const sources = useFormValue(["sources"]) as unknown[] | undefined;

  const previewTitle = props.value?.title?.trim() || articleTitle?.trim() || "ชื่อบทความจะแสดงตรงนี้";
  const previewDescription = props.value?.description?.trim() || "เพิ่ม Meta Description เพื่อให้เห็นตัวอย่างคำอธิบายสำหรับผลการค้นหา";
  const previewUrl = props.value?.canonical?.trim() || `https://ccpun.com/blog/…/${slug || "article-slug"}/`;
  const hasFeaturedImage = Boolean(featuredImage?.asset?._ref || migratedFeaturedImage?.src);
  const isPublished = Boolean(publishedAt);

  const checks = [
    { label: "SEO Title / ชื่อบทความ", ok: Boolean(previewTitle && previewTitle !== "ชื่อบทความจะแสดงตรงนี้") },
    { label: "Meta Description", ok: Boolean(props.value?.description?.trim()) },
    { label: "Semantic Topic", ok: Boolean(props.value?.semanticTopic) },
    { label: "Search Intent", ok: Boolean(props.value?.searchIntent) },
    { label: "Featured Image", ok: hasFeaturedImage },
    { label: "Author", ok: Boolean(author?._ref) },
    { label: "Sources", ok: Boolean(sources?.length) },
    { label: "Indexability", ok: !props.value?.noindex },
  ];

  return (
    <Stack space={4}>
      <Card padding={4} radius={3} border>
        <Stack space={3}>
          <Text size={1} weight="semibold">Google Preview</Text>
          <Text size={2} weight="semibold">{previewTitle}</Text>
          <Text size={1} muted>{previewUrl}</Text>
          <Text size={1}>{previewDescription}</Text>
          <Text size={1} muted>ตัวอย่างนี้ใช้สำหรับตรวจความครบถ้วน ไม่ได้จำลองการแสดงผลของ Google แบบ 1:1</Text>
        </Stack>
      </Card>

      <Card padding={4} radius={3} border>
        <Stack space={3}>
          <Flex align="center" justify="space-between" gap={3}>
            <Text size={1} weight="semibold">สถานะ SEO ที่ควรตรวจ</Text>
            <Badge tone={isPublished ? "primary" : "default"}>{isPublished ? "เผยแพร่แล้ว" : "ฉบับร่าง"}</Badge>
          </Flex>
          {checks.map((check) => (
            <Flex key={check.label} align="center" justify="space-between" gap={3}>
              <Text size={1}>{check.label}</Text>
              <Badge tone={check.ok ? "positive" : "caution"}>{statusLabel(check.ok)}</Badge>
            </Flex>
          ))}
        </Stack>
      </Card>

      <Card padding={4} radius={3} border tone={isPublished ? "caution" : "default"}>
        <Stack space={2}>
          <Text size={1} weight="semibold">Protected SEO fields</Text>
          <Text size={1}>
            {isPublished
              ? "บทความนี้เคยเผยแพร่แล้ว: URL Slug, หมวดหมู่ที่กำหนด path, Canonical override และ Noindex ถูกล็อกใน Studio เพื่อป้องกันการย้าย URL หรือหลุด index โดยไม่ตั้งใจ"
              : "ก่อนเผยแพร่สามารถกำหนด URL และ indexability ได้ เมื่อมีวันเผยแพร่แล้ว field ที่กระทบ URL/index จะถูกล็อกและต้องใช้ SEO Migration Workflow หากต้องการเปลี่ยน"}
          </Text>
          <Text size={1} muted>Semantic Topic แยกจาก URL จริง จึงใช้จัด Knowledge Graph ได้โดยไม่ต้องย้าย canonical path</Text>
        </Stack>
      </Card>

      <Card padding={4} radius={3} border tone={tone}>
        <Stack space={3}>
          <Flex align="center" justify="space-between" gap={3}>
            <Stack space={2}>
              <Text size={1} weight="semibold">ผลตรวจ SEO ล่าสุดที่บันทึก</Text>
              <Text size={4} weight="bold">{score == null ? "ยังไม่ตรวจ" : `${score}/100`}</Text>
            </Stack>
            {score != null ? <Badge tone={tone}>ตรวจเมื่อ {formatDate(snapshot?.auditedAt)}</Badge> : null}
          </Flex>
          {score != null ? (
            <Text size={1}>ผ่าน {snapshot?.passedChecks ?? 0} · จุดสำคัญ {snapshot?.criticalIssues ?? 0} · คำเตือน {snapshot?.warnings ?? 0}</Text>
          ) : null}
          <Text size={1} muted>หากแก้บทความหลังเวลานี้ ให้กดตรวจ SEO ใหม่ใน Control Plane คะแนนเป็นกฎภายในของ CCPun ไม่ใช่คะแนนจาก Google</Text>
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  );
}
