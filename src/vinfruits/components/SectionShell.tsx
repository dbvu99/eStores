export function SectionShell({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 py-10 mx-auto max-w-7xl">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          {eyebrow && (
            <p className="text-sm font-bold uppercase text-primary">
              {eyebrow}
            </p>
          )}
          <h2 className="text-3xl font-black uppercase">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
