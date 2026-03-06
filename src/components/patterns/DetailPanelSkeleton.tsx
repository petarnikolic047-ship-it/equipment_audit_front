interface DetailPanelSkeletonProps {
  lines?: number
}

export function DetailPanelSkeleton({ lines = 5 }: DetailPanelSkeletonProps) {
  const widths = ['w-full', 'w-11/12', 'w-4/5', 'w-10/12', 'w-3/4', 'w-5/6']
  const rows = Array.from({ length: lines }, (_, index) => widths[index % widths.length])

  return (
    <div className="detail-skeleton animate-pulse rounded-sm p-3">
      <div className="space-y-2">
        {rows.map((widthClass, index) => (
          <div key={`detail-skeleton-line-${index}`} className={`detail-skeleton-line ${widthClass}`} />
        ))}
      </div>
    </div>
  )
}
