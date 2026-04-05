export default function DebitAccountLoading() {
  return (
    <div className="min-h-dvh bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col px-4 pb-0 pt-3 md:max-w-[860px] md:px-6 lg:max-w-[1160px] lg:px-8 xl:max-w-[1280px]">
        <div className="h-14 shrink-0 border-b border-white/[0.06]" />
        <div className="flex-1 animate-pulse pb-24 pt-8">
          <div className="mx-auto h-4 w-20 rounded-full bg-white/8" />
          <div className="mx-auto mt-3 h-10 w-40 rounded-full bg-white/10" />
          <div className="mx-auto mt-6 h-10 w-40 rounded-full bg-white/8" />
          <div className="mt-20 space-y-3 lg:mx-auto lg:w-full lg:max-w-[58rem] xl:max-w-[62rem]">
            <div className="h-6 w-56 rounded-full bg-white/10" />
            <div className="h-24 rounded-[0.9rem] bg-white/[0.05]" />
            <div className="h-24 rounded-[0.9rem] bg-white/[0.05]" />
            <div className="h-24 rounded-[0.9rem] bg-white/[0.05]" />
          </div>
        </div>
      </div>
    </div>
  );
}
