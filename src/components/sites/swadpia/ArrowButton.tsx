/** Round diagonal-arrow button shown inside hover cards; fills blue on hover. */
export function ArrowButton({ href }: { href?: string }) {
  const paths = (stroke: string) => (
    <path d="m3.5 10.5 7-7m0 0H4.379m6.121 0v6.121" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  );
  return (
    <a className="swiper_buttons" href={href} target={href ? "_blank" : undefined} rel={href ? "noreferrer" : undefined}>
      <svg className="default" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        {paths("#000")}
      </svg>
      <svg className="hover" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        {paths("#fff")}
      </svg>
    </a>
  );
}
