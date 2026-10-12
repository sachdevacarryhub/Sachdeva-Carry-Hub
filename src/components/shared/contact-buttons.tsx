import { Phone } from "lucide-react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { telHref, whatsappHref } from "@/lib/utils/contact";
import { cn } from "@/lib/utils/cn";

interface ContactButtonProps {
  phone: string | null | undefined;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function WhatsAppButton({
  phone,
  message,
  label = "WhatsApp Enquiry",
  variant = "primary",
  size = "lg",
  className,
}: ContactButtonProps & { message?: string }) {
  const href = whatsappHref(phone, message);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClasses({ variant, size, className })}
    >
      <WhatsAppIcon className="size-[18px]" />
      {label}
      <span className="sr-only"> (opens WhatsApp)</span>
    </a>
  );
}

export function CallButton({
  phone,
  label = "Call Now",
  variant = "secondary",
  size = "lg",
  className,
}: ContactButtonProps) {
  const href = telHref(phone);
  if (!href) return null;
  return (
    <a href={href} className={cn(buttonClasses({ variant, size, className }))}>
      <Phone aria-hidden className="size-[17px]" strokeWidth={1.75} />
      {label}
    </a>
  );
}
