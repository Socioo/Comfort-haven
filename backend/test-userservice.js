const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { UsersService } = require('./dist/src/users/users.service');

async function checkUserUpdate() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const users = await usersService.findAll();
  if (users.length === 0) {
    console.log("No users found.");
    return;
  }

  const user = users[0];
  console.log(`Testing with user ${user.id} (${user.email})`);
  console.log(`Current profile image: ${user.profileImage}`);

  const testUrl = 'https://res.cloudinary.com/test/image.jpg';
  console.log(`Updating to: ${testUrl}`);
  await usersService.update(user.id, { profileImage: testUrl });

  const updatedUser = await usersService.findById(user.id);
  console.log(`Updated profile image: ${updatedUser.profileImage}`);

  await app.close();
}

checkUserUpdate().catch(console.error);
