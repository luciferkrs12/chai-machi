import { Link } from "@tanstack/react-router";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  to: string;
  children?: React.ReactNode;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    // For simplicity, ignoring active/pending for now
    return (
      <Link
        ref={ref}
        to={to}
        className={cn(className)}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
