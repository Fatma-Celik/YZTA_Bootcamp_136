// utils/validation.ts

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export interface PasswordCheck {
  valid: boolean;
  message?: string;
}

// Kayıt (register) ekranı için daha sıkı kural seti
export const isValidPasswordStrict = (password: string): PasswordCheck => {
  if (password.length < 8) {
    return { valid: false, message: 'Şifre en az 8 karakter olmalı.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Şifre en az bir büyük harf içermeli.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Şifre en az bir küçük harf içermeli.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Şifre en az bir rakam içermeli.' };
  }
  return { valid: true };
};
