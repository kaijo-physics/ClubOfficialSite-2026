export default function Container({ children, size, className }: { children: React.ReactNode , size?: "sm" | "md" | "lg", className?: string }) {
  switch (size) {
    case "sm":
      return <div className={`max-w-2xl mx-auto ${className}`}>{children}</div>;
    case "md":
      return <div className={`max-w-2xl lg:max-w-4xl mx-auto ${className}`}>{children}</div>;
    case "lg":
      return <div className={`max-w-2xl lg:max-w-5xl mx-auto ${className}`} >{children}</div>;
    default:
      return <div className={`max-w-2xl lg:max-w-4xl mx-auto ${className}`}>{children}</div>;
  }
}