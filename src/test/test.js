import bcrypt from 'bcrypt';
import assert from 'assert';
import UserManager from '../src/UserManager.js';

// Helper para probar excepciones
async function assertThrowsAsync(fn, errorMessage) {
  let threw = false;
  try {
    await fn();
  } catch (err) {
    threw = true;
    assert.strictEqual(err.message, errorMessage);
  }
  assert(threw, 'Expected an error to be thrown');
}

// Tests
(async () => {
  console.log('Iniciando pruebas...');

  const userManager = new UserManager();

  // Test 1: Crear un usuario correctamente
  console.log('Test 1: Crear un usuario');
  const createResult = await userManager.createUser('testuser', 'test@example.com', 'password123');
  assert.strictEqual(createResult.message, 'Usuario registrado exitosamente');
  assert(userManager.users['testuser'], 'El usuario no se creó correctamente');
  console.log('Test 1: OK');

  // Test 2: Error al crear un usuario con username duplicado
  console.log('Test 2: Error por username duplicado');
  await assertThrowsAsync(
    () => userManager.createUser('testuser', 'otro@email.com', 'password'),
    'El username ya existe'
  );
  console.log('Test 2: OK');

  // Test 3: Error al crear un usuario con email duplicado
  console.log('Test 3: Error por email duplicado');
  await assertThrowsAsync(
    () => userManager.createUser('otrouser', 'test@example.com', 'password'),
    'El email ya está en uso'
  );
  console.log('Test 3: OK');

  // Test 4: Error al crear un usuario sin campos obligatorios
  console.log('Test 4: Error por campos faltantes');
  await assertThrowsAsync(
    () => userManager.createUser(),
    'El username, email y la contraseña son obligatorios'
  );
  console.log('Test 4: OK');

  // Test 5: Eliminar un usuario correctamente
  console.log('Test 5: Eliminar un usuario');
  const deleteResult = await userManager.deleteUser('testuser', 'password123');
  assert.strictEqual(deleteResult.message, 'Cuenta eliminada exitosamente');
  assert(!userManager.users['testuser'], 'El usuario no se eliminó correctamente');
  console.log('Test 5: OK');

  // Test 6: Error al eliminar un usuario con contraseña incorrecta
  console.log('Test 6: Error por contraseña incorrecta');
  await userManager.createUser('testuser', 'test@example.com', 'password123'); // Crear usuario nuevamente
  await assertThrowsAsync(
    () => userManager.deleteUser('testuser', 'wrongpassword'),
    'Contraseña incorrecta'
  );
  console.log('Test 6: OK');

  // Test 7: Cambiar contraseña correctamente
  console.log('Test 7: Cambiar contraseña');
  const changePasswordResult = await userManager.changePassword('testuser', 'password123', 'newpassword');
  assert.strictEqual(changePasswordResult.message, 'Contraseña cambiada exitosamente');
  assert(bcrypt.compareSync('newpassword', userManager.users['testuser'].password), 'La contraseña no se cambió correctamente');
  console.log('Test 7: OK');

  console.log('Todas las pruebas pasaron correctamente.');
})();