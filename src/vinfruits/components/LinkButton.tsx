export function LinkButton({
  href,
  children,
  className = "",
  onNavigate,
  ...anchorProps
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onNavigate: (href: string) => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">) {
  return (
    <a
      href={href}
      className={className}
      {...anchorProps}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(href);
      }}
    >
      {children}
    </a>
  );
}
