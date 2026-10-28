import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { query } from './connection';
import { appConfig } from '../../common/config/app.config';
import { logger } from '../observability/logger';

export const seedGuestAccounts = async () => {
  try {
    logger.info('Seeding guest accounts...');

    for (const account of Object.values(appConfig.guestAccounts)) {
      // Check if guest account already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [account.email]
      );

      if (existingUser.rows.length > 0) {
        logger.info(`Guest account already exists: ${account.email}`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(account.password, appConfig.bcryptRounds);

      // Create user
      const userId = uuidv4();
      const userRole = account.role === 'doctor' ? 'doctor' : 'patient';

      await query(
        `INSERT INTO users (id, email, password_hash, phone, role, is_email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())`,
        [userId, account.email, hashedPassword, account.phone, userRole]
      );

      // Create user profile
      await query(
        `INSERT INTO profiles (id, user_id, first_name, last_name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [uuidv4(), userId, account.firstName, account.lastName]
      );

      // If doctor, create doctor profile
      if (userRole === 'doctor') {
        await query(
          `INSERT INTO doctors (id, user_id, license_number, specialization, qualification, experience_years, languages, consultation_fee, rating, total_consultations, bio, is_verified, is_available, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, true, NOW(), NOW())`,
          [
            uuidv4(),
            userId,
            'DEMO-LICENSE-' + userId.substring(0, 8),
            '{General Practice}',
            'MD',
            5,
            '{English}',
            500,
            4.5,
            0,
            'Guest doctor account for testing',
          ]
        );
      }

      logger.info(`Guest account created successfully: ${account.email} (${userRole})`);
    }

    logger.info('Guest accounts seeding completed');
  } catch (error) {
    logger.error('Error seeding guest accounts', { error });
    throw error;
  }
};
