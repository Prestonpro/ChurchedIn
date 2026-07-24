/** Suspense fallback rendered by each route segment's loading.tsx while its
 * server component's data fetch resolves. */
export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="size-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" />
    </div>
  );
}
