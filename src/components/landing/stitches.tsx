export function Stitches() {
  return (
    <>
      {["-left-[5px]", "-right-[5px]"].map((side) => (
        <span
          key={side}
          aria-hidden
          className={`absolute -top-[6px] ${side} z-10 size-[11px] before:absolute before:top-1/2 before:left-0 before:h-px before:w-full before:-translate-y-1/2 before:rotate-45 before:rounded-full before:bg-foreground/40 after:absolute after:top-1/2 after:left-0 after:h-px after:w-full after:-translate-y-1/2 after:-rotate-45 after:rounded-full after:bg-foreground/40`}
        />
      ))}
    </>
  );
}
