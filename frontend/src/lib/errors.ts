import type { AxiosError } from 'axios';

type FieldErrors = Record<string, string[] | string | undefined>;

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const data = (err as AxiosError<{ message?: string; errors?: FieldErrors }>)?.response?.data;
  if (!data) return fallback;

  const fieldLines = formatFieldErrors(data.errors);
  if (fieldLines.length) {
    return fieldLines.join('\n');
  }

  return data.message || fallback;
}

export function getFieldErrors(err: unknown): Record<string, string> {
  const data = (err as AxiosError<{ errors?: FieldErrors }>)?.response?.data;
  const result: Record<string, string> = {};
  if (!data?.errors || typeof data.errors !== 'object') return result;

  for (const [key, value] of Object.entries(data.errors)) {
    if (Array.isArray(value) && value.length) {
      result[key] = value.join('. ');
    } else if (typeof value === 'string' && value) {
      result[key] = value;
    }
  }
  return result;
}

function formatFieldErrors(errors?: FieldErrors): string[] {
  if (!errors || typeof errors !== 'object') return [];
  return Object.entries(errors).flatMap(([field, value]) => {
    if (Array.isArray(value)) {
      return value.map((msg) => `${labelFor(field)}: ${msg}`);
    }
    if (typeof value === 'string') return [`${labelFor(field)}: ${value}`];
    return [];
  });
}

function labelFor(field: string): string {
  const map: Record<string, string> = {
    email: 'Email',
    password: 'Password',
    firstName: 'First name',
    lastName: 'Last name',
  };
  return map[field] || field;
}
