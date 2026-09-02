"use client";

import { useEffect, useState } from "react";
import { useDocumentOperation, type DocumentActionComponent } from "sanity";
import type { AdminEnvironment } from "../../../lib/admin/environment";

type ArticleDraftForPublish = {
  publishedAt?: string;
  review?: { status?: string };
};

export function createGoogleSafeArticlePublishAction(
  originalAction: DocumentActionComponent,
): DocumentActionComponent {
  const GoogleSafeArticlePublishAction: DocumentActionComponent = (props) => {
    const result = originalAction(props);
    const { patch, publish } = useDocumentOperation(props.id, props.type);
    const [isPublishing, setIsPublishing] = useState(false);
    const draft = props.draft as (typeof props.draft & ArticleDraftForPublish) | null;
    const isApproved = draft?.review?.status === "approved";
    const scheduledTimestamp = draft?.publishedAt ? Date.parse(draft.publishedAt) : Number.NaN;
    const hasFuturePublicationDate = Number.isFinite(scheduledTimestamp) && scheduledTimestamp > Date.now();

    useEffect(() => {
      if (isPublishing && !props.draft) setIsPublishing(false);
    }, [isPublishing, props.draft]);

    if (!result) return null;

    const blockedLabel = !isApproved
      ? "ต้องอนุมัติเนื้อหาก่อนเผยแพร่"
      : hasFuturePublicationDate
        ? "ใช้ Schedule สำหรับวันเผยแพร่ในอนาคต"
        : null;

    return {
      ...result,
      disabled: Boolean(result.disabled || publish.disabled || isPublishing || blockedLabel),
      label: blockedLabel ?? (isPublishing ? "กำลังเผยแพร่…" : result.label),
      onHandle: () => {
        const now = new Date().toISOString();
        setIsPublishing(true);
        patch.execute([
          {
            set: {
              contentUpdatedAt: now,
              ...(draft?.publishedAt ? {} : { publishedAt: now }),
            },
          },
        ]);
        publish.execute();
        props.onComplete();
      },
    };
  };

  GoogleSafeArticlePublishAction.action = "publish";
  GoogleSafeArticlePublishAction.displayName = "CCPunGoogleSafeArticlePublishAction";
  return GoogleSafeArticlePublishAction;
}

export function wrapGoogleSafeArticlePublishActions(
  actions: DocumentActionComponent[],
  environment: AdminEnvironment,
  schemaType?: string,
): DocumentActionComponent[] {
  if ((environment !== "local-production" && environment !== "production-admin") || schemaType !== "article") {
    return actions;
  }

  return actions.map((action) =>
    action.action === "publish" ? createGoogleSafeArticlePublishAction(action) : action,
  );
}
