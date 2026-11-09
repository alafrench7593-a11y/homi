/** Modèles de listes de préparation (personnalisables ensuite). */
import type { ChecklistKind } from '@/lib/types';
import { localized } from '@/i18n/localized';

type Templates = Record<Exclude<ChecklistKind, 'custom'>, { title: string; icon: string; items: string[] }>;

const CHECKLIST_TEMPLATES_FR: Templates = {
  maternity_bag: {
    title: 'Valise de maternité',
    icon: 'briefcase',
    items: ['Carte Vitale et pièce d’identité', 'Dossier de suivi de grossesse et résultats d’examens', 'Carte de groupe sanguin (si vous l’avez)', 'Vêtements confortables et chaussons', 'Protections et sous-vêtements adaptés', 'Nécessaire de toilette', 'Chargeur de téléphone', 'Bodies, pyjamas, bonnet et chaussettes pour bébé', 'Gigoteuse ou couverture', 'Siège auto adapté pour le retour'],
  },
  baby_items: {
    title: 'Affaires de bébé',
    icon: 'gift',
    items: ['Couchage adapté (matelas ferme, sans tour de lit ni couette)', 'Gigoteuses', 'Bodies et pyjamas', 'Table ou matelas à langer', 'Couches et liniment ou eau', 'Thermomètre', 'Siège auto', 'Porte-bébé ou poussette'],
  },
  home: { title: 'Préparation du logement', icon: 'home', items: ['Préparer le coin nuit', 'Prévoir un espace de change', 'Organiser les rangements', 'Vérifier le détecteur de fumée'] },
  admin: {
    title: 'Démarches administratives',
    icon: 'file-text',
    items: ['Déclarer la grossesse (avant la fin du 3e mois)', 'Informer l’employeur si vous le souhaitez', 'Préparer la déclaration de naissance (dans les 5 jours)', 'Prévenir la caisse d’assurance maladie et la CAF', 'Choisir un mode de garde'],
  },
  purchases: { title: 'Achats utiles', icon: 'shopping-bag', items: ['Siège auto', 'Lit ou berceau', 'Baignoire ou transat de bain', 'Tire-lait (si besoin)', 'Biberons (si besoin)'] },
  coparent: { title: 'Préparation du coparent', icon: 'users', items: ['Se renseigner sur le congé de naissance / paternité', 'Préparer l’organisation des premières semaines', 'Participer à un rendez-vous de préparation', 'Savoir reconnaître les signes de détresse après la naissance'] },
  siblings: { title: 'Organisation avec les aînés', icon: 'smile', items: ['Annoncer l’arrivée du bébé avec des mots simples', 'Prévoir qui garde les aînés pendant l’accouchement', 'Garder un moment rien qu’avec chaque aîné', 'Lire un livre sur l’arrivée d’un petit frère ou d’une petite sœur'] },
  multiples: { title: 'Jumeaux & triplés', icon: 'copy', items: ['Deux (ou trois) sièges auto adaptés', 'Poussette double ou triple', 'Organisation des nuits en relais', 'Solliciter l’aide de l’entourage', 'Se renseigner sur les associations de parents de multiples'] },
};

const CHECKLIST_TEMPLATES_EN: Templates = {
  maternity_bag: {
    title: 'Hospital bag',
    icon: 'briefcase',
    items: ['Health insurance card (Carte Vitale) and ID', 'Pregnancy notes and test results', 'Blood group card (if you have one)', 'Comfortable clothes and slippers', 'Maternity pads and suitable underwear', 'Toiletries', 'Phone charger', 'Babygrows, pyjamas, hat and socks for the baby', 'Sleeping bag or blanket', 'Car seat suitable for the journey home'],
  },
  baby_items: {
    title: 'Baby essentials',
    icon: 'gift',
    items: ['Suitable sleeping space (firm mattress, no bumper or duvet)', 'Baby sleeping bags', 'Bodysuits and pyjamas', 'Changing table or mat', 'Nappies and cleansing lotion or water', 'Thermometer', 'Car seat', 'Baby carrier or pushchair'],
  },
  home: { title: 'Getting the home ready', icon: 'home', items: ['Set up the sleeping area', 'Plan a changing space', 'Organise storage', 'Check the smoke alarm'] },
  admin: {
    title: 'Paperwork',
    icon: 'file-text',
    items: ['Declare the pregnancy (before the end of the 3rd month)', 'Tell your employer if you wish', 'Prepare the birth registration (within 5 days)', 'Notify the health insurance fund and the family allowance office (CAF)', 'Choose childcare'],
  },
  purchases: { title: 'Useful purchases', icon: 'shopping-bag', items: ['Car seat', 'Cot or crib', 'Baby bath or bath seat', 'Breast pump (if needed)', 'Bottles (if needed)'] },
  coparent: { title: 'Co-parent preparation', icon: 'users', items: ['Find out about birth / paternity leave', 'Plan how the first weeks will work', 'Go to a preparation appointment', 'Know the signs of distress after birth'] },
  siblings: { title: 'Planning with older children', icon: 'smile', items: ['Tell them about the baby in simple words', 'Decide who looks after them during the birth', 'Keep some time just with each older child', 'Read a book about a new little brother or sister'] },
  multiples: { title: 'Twins & triplets', icon: 'copy', items: ['Two (or three) suitable car seats', 'Double or triple pushchair', 'Night shifts in relay', 'Ask family and friends for help', 'Find out about parent associations for multiples'] },
};

const CHECKLIST_TEMPLATES_ES: Templates = {
  maternity_bag: {
    title: 'Bolsa para la maternidad',
    icon: 'briefcase',
    items: ['Tarjeta sanitaria (Carte Vitale) y documento de identidad', 'Historial del seguimiento del embarazo y resultados de las pruebas', 'Tarjeta de grupo sanguíneo (si la tienes)', 'Ropa cómoda y zapatillas', 'Compresas y ropa interior adecuadas', 'Neceser de aseo', 'Cargador del teléfono', 'Bodis, pijamas, gorrito y calcetines para el bebé', 'Saco de dormir o mantita', 'Silla de coche adecuada para la vuelta a casa'],
  },
  baby_items: {
    title: 'Cosas del bebé',
    icon: 'gift',
    items: ['Lugar para dormir adecuado (colchón firme, sin protector de cuna ni edredón)', 'Sacos de dormir', 'Bodis y pijamas', 'Cambiador o colchoneta para cambiar', 'Pañales y linimento o agua', 'Termómetro', 'Silla de coche', 'Portabebés o carrito'],
  },
  home: { title: 'Preparar la casa', icon: 'home', items: ['Preparar el rincón para dormir', 'Prever un espacio para cambiar al bebé', 'Organizar los armarios', 'Comprobar el detector de humo'] },
  admin: {
    title: 'Trámites administrativos',
    icon: 'file-text',
    items: ['Declarar el embarazo (antes de que acabe el 3.er mes)', 'Informar a tu empresa si lo deseas', 'Preparar la declaración de nacimiento (en los 5 días)', 'Avisar a la caja del seguro de enfermedad (Assurance maladie) y a la CAF', 'Elegir un modo de cuidado infantil'],
  },
  purchases: { title: 'Compras útiles', icon: 'shopping-bag', items: ['Silla de coche', 'Cuna o moisés', 'Bañera o hamaca de baño', 'Sacaleches (si hace falta)', 'Biberones (si hace falta)'] },
  coparent: { title: 'Preparación del otro progenitor', icon: 'users', items: ['Informarse sobre el permiso de nacimiento / paternidad', 'Preparar la organización de las primeras semanas', 'Asistir a una cita de preparación', 'Saber reconocer las señales de malestar después del parto'] },
  siblings: { title: 'Organización con los hermanos mayores', icon: 'smile', items: ['Anunciar la llegada del bebé con palabras sencillas', 'Prever quién cuida a los mayores durante el parto', 'Guardar un momento a solas con cada hermano mayor', 'Leer un libro sobre la llegada de un hermanito o una hermanita'] },
  multiples: { title: 'Gemelos y trillizos', icon: 'copy', items: ['Dos (o tres) sillas de coche adecuadas', 'Carrito doble o triple', 'Organizar las noches por turnos', 'Pedir ayuda a tu entorno', 'Informarse sobre las asociaciones de padres de partos múltiples'] },
};

const CHECKLIST_TEMPLATES_DE: Templates = {
  maternity_bag: {
    title: 'Kliniktasche',
    icon: 'briefcase',
    items: ['Versichertenkarte (Carte Vitale) und Ausweis', 'Unterlagen zur Schwangerschaftsvorsorge und Untersuchungsergebnisse', 'Blutgruppenausweis (falls vorhanden)', 'Bequeme Kleidung und Hausschuhe', 'Wochenbetteinlagen und passende Unterwäsche', 'Kulturbeutel', 'Handy-Ladegerät', 'Bodys, Schlafanzüge, Mütze und Söckchen fürs Baby', 'Schlafsack oder Decke', 'Passender Autositz für die Heimfahrt'],
  },
  baby_items: {
    title: 'Babysachen',
    icon: 'gift',
    items: ['Geeigneter Schlafplatz (feste Matratze, ohne Nestchen und Bettdecke)', 'Babyschlafsäcke', 'Bodys und Schlafanzüge', 'Wickeltisch oder Wickelauflage', 'Windeln und Pflegeöl-Lotion (Liniment) oder Wasser', 'Thermometer', 'Autositz', 'Babytrage oder Kinderwagen'],
  },
  home: { title: 'Die Wohnung vorbereiten', icon: 'home', items: ['Die Schlafecke einrichten', 'Einen Wickelplatz einplanen', 'Stauraum organisieren', 'Den Rauchmelder prüfen'] },
  admin: {
    title: 'Behördengänge',
    icon: 'file-text',
    items: ['Die Schwangerschaft melden (vor Ende des 3. Monats)', 'Den Arbeitgeber informieren, wenn du möchtest', 'Die Geburtsanzeige vorbereiten (innerhalb von 5 Tagen)', 'Die Krankenkasse (Assurance maladie) und die CAF benachrichtigen', 'Eine Betreuungsform wählen'],
  },
  purchases: { title: 'Nützliche Anschaffungen', icon: 'shopping-bag', items: ['Autositz', 'Bett oder Wiege', 'Babybadewanne oder Badesitz', 'Milchpumpe (bei Bedarf)', 'Fläschchen (bei Bedarf)'] },
  coparent: { title: 'Vorbereitung des anderen Elternteils', icon: 'users', items: ['Sich über den Geburts- / Vaterschaftsurlaub informieren', 'Die Organisation der ersten Wochen planen', 'An einem Vorbereitungstermin teilnehmen', 'Anzeichen seelischer Not nach der Geburt erkennen können'] },
  siblings: { title: 'Organisation mit den älteren Geschwistern', icon: 'smile', items: ['Die Ankunft des Babys mit einfachen Worten ankündigen', 'Planen, wer während der Geburt auf die Älteren aufpasst', 'Mit jedem älteren Kind eine Zeit nur zu zweit behalten', 'Ein Buch über die Ankunft eines kleinen Bruders oder einer kleinen Schwester lesen'] },
  multiples: { title: 'Zwillinge & Drillinge', icon: 'copy', items: ['Zwei (oder drei) passende Autositze', 'Zwillings- oder Drillingskinderwagen', 'Die Nächte im Wechsel organisieren', 'Das Umfeld um Hilfe bitten', 'Sich über Elternvereine für Mehrlinge informieren'] },
};

const CHECKLIST_TEMPLATES_IT: Templates = {
  maternity_bag: {
    title: 'Borsa per il parto',
    icon: 'briefcase',
    items: ['Tessera sanitaria (Carte Vitale) e documento d’identità', 'Cartella di monitoraggio della gravidanza e risultati degli esami', 'Tessera del gruppo sanguigno (se ce l’hai)', 'Vestiti comodi e pantofole', 'Assorbenti e biancheria adatti', 'Beauty case', 'Caricatore del telefono', 'Body, tutine, cappellino e calzini per il bebè', 'Sacco nanna o copertina', 'Seggiolino auto adatto per il ritorno a casa'],
  },
  baby_items: {
    title: 'Cose del bebè',
    icon: 'gift',
    items: ['Posto per dormire adatto (materasso rigido, senza paracolpi né piumone)', 'Sacchi nanna', 'Body e tutine', 'Fasciatoio o materassino per il cambio', 'Pannolini e oleolito (liniment) o acqua', 'Termometro', 'Seggiolino auto', 'Marsupio o passeggino'],
  },
  home: { title: 'Preparare la casa', icon: 'home', items: ['Preparare l’angolo nanna', 'Prevedere uno spazio per il cambio', 'Organizzare gli armadi', 'Controllare il rilevatore di fumo'] },
  admin: {
    title: 'Pratiche amministrative',
    icon: 'file-text',
    items: ['Dichiarare la gravidanza (prima della fine del 3° mese)', 'Informare il datore di lavoro, se lo desideri', 'Preparare la dichiarazione di nascita (entro 5 giorni)', 'Avvisare la cassa dell’assicurazione sanitaria (Assurance maladie) e la CAF', 'Scegliere una soluzione per la custodia del bambino'],
  },
  purchases: { title: 'Acquisti utili', icon: 'shopping-bag', items: ['Seggiolino auto', 'Lettino o culla', 'Vaschetta o sdraietta da bagno', 'Tiralatte (se serve)', 'Biberon (se serve)'] },
  coparent: { title: 'Preparazione del co-genitore', icon: 'users', items: ['Informarsi sul congedo di nascita / paternità', 'Preparare l’organizzazione delle prime settimane', 'Partecipare a un incontro di preparazione', 'Saper riconoscere i segni di disagio dopo la nascita'] },
  siblings: { title: 'Organizzazione con i fratelli maggiori', icon: 'smile', items: ['Annunciare l’arrivo del bebè con parole semplici', 'Prevedere chi tiene i più grandi durante il parto', 'Tenere un momento solo per ciascun figlio maggiore', 'Leggere un libro sull’arrivo di un fratellino o di una sorellina'] },
  multiples: { title: 'Gemelli e trigemini', icon: 'copy', items: ['Due (o tre) seggiolini auto adatti', 'Passeggino doppio o triplo', 'Organizzare le notti a turno', 'Chiedere aiuto alle persone vicine', 'Informarsi sulle associazioni di genitori di gemelli'] },
};

export const CHECKLIST_TEMPLATES: Templates = localized(CHECKLIST_TEMPLATES_FR, CHECKLIST_TEMPLATES_EN, { es: CHECKLIST_TEMPLATES_ES, de: CHECKLIST_TEMPLATES_DE, it: CHECKLIST_TEMPLATES_IT });
