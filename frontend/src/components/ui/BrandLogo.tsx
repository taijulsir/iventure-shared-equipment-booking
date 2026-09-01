import Image from "next/image";

export function BrandLogo({
  height = 38,
  width = 160,
  className,
  priority = false,
}: {
  height?: number;
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={["inline-flex items-center", className].filter(Boolean).join(" ")}>
      {/* Light Mode Logo: Red circle with dark text */}
      <Image
        src="/i-Venture-Logo-light.png"
        alt="iVenture"
        width={width}
        height={height}
        className="block dark:hidden max-w-[190px] object-contain"
        style={{ height: `${height}px`, width: "auto" }}
        priority={priority}
      />
      {/* Dark Mode Logo: Red circle with white text */}
      <Image
        src="/i-Venture-Logo-.png"
        alt="iVenture"
        width={width}
        height={height}
        className="hidden dark:block max-w-[190px] object-contain"
        style={{ height: `${height}px`, width: "auto" }}
        priority={priority}
      />
    </span>
  );
}
