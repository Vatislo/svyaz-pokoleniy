import content from '@/data/content.json'

export function Footer() {
  return (
    <footer className="border-t border-stone-line bg-stone-deep py-10">
      <div className="shell flex flex-col gap-8">
        <p className="border-l-4 border-accent bg-stone px-4 py-3 text-sm text-graphite-soft">
          {content.footer.warning}
        </p>

        <div className="grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(230px,1fr))]">
          <div>
            <h2 className="kicker mb-3 text-graphite-muted">
              {content.footer.schoolTitle}
            </h2>
            <dl className="flex flex-col gap-2.5">
              {content.footer.school.map((row) => (
                <div key={row.label}>
                  <dt className="kicker text-graphite-muted">{row.label}</dt>
                  <dd className="text-sm text-graphite-soft">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="kicker mb-3 text-graphite-muted">
              {content.footer.authors.title}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {content.footer.authors.items.map((row) => (
                <li key={row.role}>
                  <span className="kicker block text-graphite-muted">
                    {row.role}
                  </span>
                  <span className="text-sm text-graphite-soft">{row.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="kicker mb-3 text-graphite-muted">
              {content.footer.leaders.title}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {content.footer.leaders.items.map((row) => (
                <li key={row.role}>
                  <span className="kicker block text-graphite-muted">
                    {row.role}
                  </span>
                  <span className="text-sm text-graphite-soft">{row.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-xs text-graphite-muted">{content.footer.legal}</p>
      </div>
    </footer>
  )
}
