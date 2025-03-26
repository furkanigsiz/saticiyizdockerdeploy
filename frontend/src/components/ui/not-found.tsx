import React from 'react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface NotFoundProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function NotFound({
  title = "Sayfa bulunamadı",
  description = "Aradığınız sayfa taşınmış veya silinmiş olabilir.",
  action,
  className,
  ...props
}: NotFoundProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center space-y-4 py-12",
        className
      )}
      {...props}
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">{title}</h1>
        <p className="max-w-[500px] text-muted-foreground">{description}</p>
      </div>
      {action || (
        <Link
          to="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          Ana Sayfaya Dön
        </Link>
      )}
    </div>
  );
}

interface IllustrationProps extends React.SVGAttributes<SVGElement> {}

export function Illustration({ className, ...props }: IllustrationProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 100"
      fill="none"
      className={cn("w-full", className)}
      {...props}
    >
      <path
        d="M58 31C58 24.3726 63.3726 19 70 19H130C136.627 19 142 24.3726 142 31V69C142 75.6274 136.627 81 130 81H70C63.3726 81 58 75.6274 58 69V31Z"
        className="fill-foreground/10"
      />
      <rect
        x="70"
        y="44"
        width="48"
        height="4"
        rx="2"
        className="fill-current"
      />
      <rect
        x="70"
        y="52"
        width="24"
        height="4"
        rx="2"
        className="fill-current"
      />
      <circle cx="98" cy="28" r="3" className="fill-current" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M58.8531 36.0658C58.8531 52.8553 43.0856 66.1949 23.4265 66.1949C20.7809 66.1949 18.2005 65.9339 15.7221 65.437C16.2337 64.1498 16.9984 62.3453 17.4983 61.0252C18.4347 58.4695 10.8334 55.6541 10.8334 45.1245C10.8334 34.0828 10.7229 21.6586 23.4265 21.6586C36.1302 21.6586 58.8531 19.2763 58.8531 36.0658Z"
        className="fill-foreground/10"
      />
      <path
        d="M18 46.5C18 53.4036 23.5964 59 30.5 59C37.4036 59 43 53.4036 43 46.5C43 39.5964 37.4036 34 30.5 34C23.5964 34 18 39.5964 18 46.5Z"
        className="fill-foreground/10"
      />
      <path
        d="M23 42.5C23 44.9853 20.9853 47 18.5 47C16.0147 47 14 44.9853 14 42.5C14 40.0147 16.0147 38 18.5 38C20.9853 38 23 40.0147 23 42.5Z"
        className="fill-foreground/10"
      />
      <path
        d="M39 37.5C39 38.8807 37.8807 40 36.5 40C35.1193 40 34 38.8807 34 37.5C34 36.1193 35.1193 35 36.5 35C37.8807 35 39 36.1193 39 37.5Z"
        className="fill-foreground/10"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M141.147 63.9342C141.147 47.1447 156.914 33.8051 176.573 33.8051C179.219 33.8051 181.8 34.0661 184.278 34.563C183.766 35.8502 183.002 37.6547 182.502 38.9748C181.565 41.5305 189.167 44.3459 189.167 54.8755C189.167 65.9172 189.277 78.3414 176.573 78.3414C163.87 78.3414 141.147 80.7237 141.147 63.9342Z"
        className="fill-foreground/10"
      />
      <path
        d="M182 53.5C182 46.5964 176.404 41 169.5 41C162.596 41 157 46.5964 157 53.5C157 60.4036 162.596 66 169.5 66C176.404 66 182 60.4036 182 53.5Z"
        className="fill-foreground/10"
      />
      <path
        d="M177 57.5C177 55.0147 179.015 53 181.5 53C183.985 53 186 55.0147 186 57.5C186 59.9853 183.985 62 181.5 62C179.015 62 177 59.9853 177 57.5Z"
        className="fill-foreground/10"
      />
      <path
        d="M161 62.5C161 61.1193 162.119 60 163.5 60C164.881 60 166 61.1193 166 62.5C166 63.8807 164.881 65 163.5 65C162.119 65 161 63.8807 161 62.5Z"
        className="fill-foreground/10"
      />
    </svg>
  );
} 