export function isConcurrencyConflict(error) {
  const message = String(error?.message || '').toLowerCase()
  return message.includes('updated by another user')
}

export function getConcurrencyMessage(language = 'ca') {
  const messages = {
    ca: "El registre ha estat actualitzat per un altre usuari. Refresca les dades i torna-ho a provar.",
    es: 'El registro ha sido actualizado por otro usuario. Recarga los datos y vuelve a intentarlo.',
    en: 'The record has been updated by another user. Refresh the data and try again.',
  }

  return messages[language] || messages.ca
}

export function resolveConcurrencyErrorMessage(error, language, fallbackMessage) {
  if (isConcurrencyConflict(error)) {
    return getConcurrencyMessage(language)
  }

  return error?.message || fallbackMessage
}
