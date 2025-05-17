import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <div className={cn('bg-white rounded-card shadow-card', className)} {...props}>
      {children}
    </div>
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const CardHeader = ({ children, className, ...props }: CardHeaderProps) => {
  return (
    <div className={cn('p-6 border-b border-gray-200', className)} {...props}>
      {children}
    </div>
  );
};

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const CardBody = ({ children, className, ...props }: CardBodyProps) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
};

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const CardFooter = ({ children, className, ...props }: CardFooterProps) => {
  return (
    <div className={cn('p-6 border-t border-gray-200', className)} {...props}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export { Card, CardHeader, CardBody, CardFooter }; 