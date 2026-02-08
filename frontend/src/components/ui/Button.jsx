import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    width = 'auto',
    isLoading = false,
    disabled = false,
    className = '',
    icon: Icon,
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-dark shadow-md active:transform active:scale-95",
        secondary: "bg-secondary text-white hover:bg-secondary-dark shadow-md active:transform active:scale-95",
        outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary-dark hover:border-primary-dark hover:text-white",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
        danger: "bg-red-600 text-white hover:bg-red-700",
    };

    const sizes = {
        sm: "text-xs px-3 py-1.5",
        md: "text-sm px-5 py-2.5",
        lg: "text-base px-6 py-3.5",
        icon: "p-2",
    };

    const widthClass = width === 'full' ? 'w-full' : '';

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="animate-spin mr-2" size={18} />
            ) : Icon ? (
                <Icon className={`mr-2 ${children ? '' : 'mr-0'}`} size={18} />
            ) : null}
            {children}
        </button>
    );
};

export default Button;
