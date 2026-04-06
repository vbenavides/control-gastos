export const APP_BOTTOM_NOTICE_EVENT = "app-bottom-notice-visibility";

export type BottomNoticeVisibilityDetail = {
  visible: boolean;
};

export function dispatchBottomNoticeVisibility(visible: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<BottomNoticeVisibilityDetail>(APP_BOTTOM_NOTICE_EVENT, {
      detail: { visible },
    }),
  );
}
