export function validateAuth(values, registration = false) {
  const errors = {};
  const email = values.email.trim();
  if (!email) errors.email = 'Escribe tu correo electrónico.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (registration && values.name.trim().length < 2) errors.name = 'Escribe tu nombre (al menos 2 caracteres).';
  else if (registration && values.name.trim().length > 50) errors.name = 'Usa un nombre de hasta 50 caracteres.';
  if (!values.password) errors.password = 'Escribe tu contraseña.';
  else if (registration && (values.password.length < 8 || !/[A-Z]/.test(values.password) || !/[a-z]/.test(values.password) || !/\d/.test(values.password))) errors.password = 'Usa al menos 8 caracteres, una mayúscula, una minúscula y un número.';
  else if (registration && new TextEncoder().encode(values.password).length > 72) errors.password = 'Esta contraseña es demasiado larga. Usa hasta 72 bytes.';
  if (registration && values.confirm !== values.password) errors.confirm = 'Las contraseñas no coinciden.';
  return errors;
}
