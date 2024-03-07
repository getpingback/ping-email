declare module "disposable-email" {
  export function validate(domainOrEmail: string): boolean;
  export function validate(
    domainOrEmail: string,
    callback: (error: null, isValid: boolean) => void
  ): void;
}
