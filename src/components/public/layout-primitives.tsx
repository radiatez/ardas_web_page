import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ContainerProps = ComponentPropsWithoutRef<"div"> & {
  as?: "div" | "section";
};

export function Container({
  as: Component = "div",
  className = "",
  ...props
}: ContainerProps) {
  return <Component className={`ds-container ${className}`.trim()} {...props} />;
}

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  spacing?: "compact" | "standard" | "large";
};

export function Section({
  className = "",
  spacing = "standard",
  ...props
}: SectionProps) {
  return (
    <section
      className={`ds-section ds-section--${spacing} ${className}`.trim()}
      {...props}
    />
  );
}

type FullBleedProps = ComponentPropsWithoutRef<"div">;

export function FullBleed({ className = "", ...props }: FullBleedProps) {
  return <div className={`ds-full-bleed ${className}`.trim()} {...props} />;
}

type GridProps = ComponentPropsWithoutRef<"div">;

export function Grid({ className = "", ...props }: GridProps) {
  return <div className={`ds-grid ${className}`.trim()} {...props} />;
}

type EyebrowProps = {
  as?: "p" | "span" | "div";
  children: ReactNode;
  className?: string;
};

export function Eyebrow({
  as: Component = "p",
  children,
  className = "",
}: EyebrowProps) {
  return (
    <Component className={`type-eyebrow ${className}`.trim()}>
      {children}
    </Component>
  );
}
