import { useEffect, useState } from "react";
import { useDocumentOperation, type DocumentActionComponent } from "sanity";

export function createGoogleSafeArticlePublishAction(
  originalAction: DocumentActionComponent,
): DocumentActionComponent {
  const GoogleSafeArticlePublishAction: DocumentActionComponent = (props) => {
    const result = originalAction(props);
    const { patch, publish } = useDocumentOperation(props.id, props.type);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
      if (isPublishing && !props.draft) setIsPublishing(false);
    }, [isPublishing, props.draft]);

    if (!result) return null;

    return {
      ...result,
      disabled: Boolean(result.disabled || publish.disabled || isPublishing),
      label: isPublishing ? "กำลังเผยแพร่…" : result.label,
      onHandle: () => {
        setIsPublishing(true);
        patch.execute([{ set: { contentUpdatedAt: new Date().toISOString() } }]);
        publish.execute();
        props.onComplete();
      },
    };
  };

  GoogleSafeArticlePublishAction.action = "publish";
  GoogleSafeArticlePublishAction.displayName = "CCPunGoogleSafeArticlePublishAction";
  return GoogleSafeArticlePublishAction;
}
