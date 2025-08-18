import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { UserRole } from './users/enums/user-role.enum';

async function createAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // Create admin user
    const adminUser = await usersService.create({
      username: 'admin',
      email: 'admin@demonicka.cz',
      password: 'admin123', // Change this password!
      role: UserRole.ADMIN,
    });

    console.log('✅ Admin user created successfully!');
    console.log('Username:', adminUser.username);
    console.log('Email:', adminUser.email);
    console.log('Role:', adminUser.role);
    console.log('ID:', adminUser.id);
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
  } finally {
    await app.close();
  }
}

createAdmin();
