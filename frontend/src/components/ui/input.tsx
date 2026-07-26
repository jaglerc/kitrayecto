import type { ReactNode } from "react";

interface InputProps {
    value: string;
    onChange: (value: string) => void;

    type?: string;
    placeholder?: string;

    leftIcon?: ReactNode;
    rightIcon?: ReactNode;

    onRightIconClick?: () => void;

    disabled?: boolean;
}

export default function Input({
    value,
    onChange,
    type = "text",
    placeholder,
    leftIcon,
    rightIcon,
    onRightIconClick,
    disabled = false,
}: InputProps) {
    return (
        <div className="relative flex w-full max-w-sm items-center">
            {leftIcon && (
                <span className="absolute left-4 flex items-center text-gray-400 pointer-events-none">
                    {leftIcon}
                </span>
            )}

            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={`
                    w-full
                    h-14
                    bg-white
                    border
                    border-gray-200
                    rounded-xl
                    text-gray-700
                    placeholder-gray-400
                    text-base
                    focus:outline-none
                    focus:border-gray-300
                    shadow-sm
                    transition-all
                    disabled:bg-gray-100
                    disabled:cursor-not-allowed
                    ${leftIcon ? "pl-12" : "pl-4"}
                    ${rightIcon ? "pr-12" : "pr-4"}
                `}
            />

            {rightIcon && (
                <button
                    type="button"
                    onClick={onRightIconClick}
                    disabled={disabled}
                    className="absolute right-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                    {rightIcon}
                </button>
            )}
        </div>
    );
}
