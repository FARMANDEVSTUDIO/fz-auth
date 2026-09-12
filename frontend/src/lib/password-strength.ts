export interface PasswordCheck {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export function checkPasswordStrength(password: string): PasswordCheck {
  const errors: string[] = [];

  if (password.length < 8) errors.push('Minimum 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least 1 uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least 1 lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least 1 number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('At least 1 special character (!@#$%...)');

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const strength: PasswordCheck['strength'] = score >= 4 ? 'strong' : score >= 3 ? 'medium' : 'weak';

  return { valid: errors.length === 0, errors, strength };
}
