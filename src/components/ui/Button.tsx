import { cn } from '../../utils/cn';

export const Button = ({ children, className, disabled, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button 
    disabled={disabled}
    className={cn(
      "px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
      "bg-[var(--primary-accent)] text-white hover:opacity-90 shadow-sm",
      className
    )} 
    {...props}
  >
    {children}
  </button>
);
