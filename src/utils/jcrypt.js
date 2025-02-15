import { pbkdf2 } from 'crypto';

const hashPassword = (password, salt) => {
  return new Promise((resolve, reject) => {
    pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
};

const comparePassword = async (inputPassword, storedPasswordHash, salt) => {
  const inputPasswordHash = await hashPassword(inputPassword, salt);
  return inputPasswordHash === storedPasswordHash;
};
export {
  comparePassword,
  hashPassword
}