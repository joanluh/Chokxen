// El contrato aún no define onboarding. Solo se aplica después de verificar
// el perfil; estas preferencias locales no conceden roles ni acceso al backend.
export function withLocalOnboarding(profile, preferencesByUser) {
  if (!profile || profile.demo) return profile;
  const saved = preferencesByUser?.[profile.email];
  const completed = saved?.completed === true && Array.isArray(saved.teams) && Array.isArray(saved.leagues);
  return { ...profile, onboarded: completed };
}
