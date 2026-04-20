"use client";

import * as React from "react";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> & {
  href?: React.ComponentPropsWithoutRef<typeof Link>["href"];
};

const Logo = React.forwardRef<React.ElementRef<typeof Link>, LogoProps>(function Logo(
  { className, href = "/", prefetch = false, ...props },
  ref,
) {
  return (
    <Link ref={ref} className={cn("logo", className)} href={href} prefetch={prefetch} {...props}>
      <Image
        src="/images/logo.png"
        alt="The Cork Conclave"
        width={1875}
        height={669}
        className="h-8 w-auto max-w-full object-contain object-left"
        priority
      />
    </Link>
  );
});

export default Logo;
