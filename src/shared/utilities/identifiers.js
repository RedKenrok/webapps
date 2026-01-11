const IDENTIFIER_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const createIdentifier = (
  length = 32,
) => {
  let result = '';
  const charactersLength = IDENTIFIER_CHARACTERS.length;
  let counter = 0;
  while (counter < length) {
    result += IDENTIFIER_CHARACTERS.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
