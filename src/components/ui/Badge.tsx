interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  success: 'bg-secondary/20 text-secondary',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-danger/20 text-danger',
  neutral: 'bg-highlight/30 text-foreground',
  info: 'bg-primary/20 text-primary',
};

export default function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
