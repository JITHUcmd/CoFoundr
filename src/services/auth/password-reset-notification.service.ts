export type PasswordResetNotificationPayload = {
  email: string;
  resetToken: string;
  expiresAt: Date;
};

export interface PasswordResetNotificationService {
  sendPasswordReset(payload: PasswordResetNotificationPayload): Promise<void>;
}

export class DevelopmentPasswordResetNotificationService implements PasswordResetNotificationService {
  async sendPasswordReset(_payload: PasswordResetNotificationPayload) {
    // Development placeholder only.
    // Future email providers should be integrated here or behind another implementation
    // of PasswordResetNotificationService. Do not log or expose the reset token.
  }
}

export const passwordResetNotificationService =
  new DevelopmentPasswordResetNotificationService();
