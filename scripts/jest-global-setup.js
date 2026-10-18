// Les tests de dates (changements d'heure de l'agenda) s'exécutent en heure de Paris, sur toute machine.
module.exports = async () => { process.env.TZ = 'Europe/Paris'; };
