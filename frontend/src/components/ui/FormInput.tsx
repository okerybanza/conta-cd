import React from 'react';
import { UseFormRegisterReturn, FieldError } from 'react-hook-form';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
    label: string;
    register: UseFormRegisterReturn;
    error?: FieldError;
    type?: string;
    className?: string;
    as?: 'input' | 'select' | 'textarea';
    children?: React.ReactNode;
}

export const FormInput: React.FC<FormInputProps> = ({
    label,
    register,
    error,
    type = 'text',
    className = '',
    as = 'input',
    children,
    ...props
}) => {
    const Component = as as any;
    const errorClass = error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-primary focus:border-primary';

    return (
        <div className={`mb-4 ${className}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {props.required && <span className="text-red-500">*</span>}
            </label>

            <Component
                {...register}
                {...props}
                type={as === 'input' ? type : undefined}
                className={`block w-full rounded-md shadow-sm sm:text-sm transition-colors ${errorClass} ${as === 'textarea' ? 'py-2 px-3' : 'h-10 px-3'}`}
            >
                {children}
            </Component>

            {error && (
                <p className="mt-1 text-sm text-red-600 animate-fade-in">
                    {error.message}
                </p>
            )}
        </div>
    );
};
