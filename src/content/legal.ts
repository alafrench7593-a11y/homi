import { onLocaleChange } from '@/i18n';
/**
 * Documents juridiques (CGU, confidentialité, mentions légales, suppression du compte, aide), version du 10/11/2026.
 * Rédigés à partir du fonctionnement réel de l'app ; une relecture par un juriste reste recommandée.
 * Version acceptée à l'inscription : LEGAL_VERSIONS (src/lib/authFlow.ts).
 */
import { BRAND } from '@/config/brand';
import { inLang, localized } from '@/i18n/localized';

const LEGAL_DRAFT_NOTICE_FR = 'Brouillon — à valider par un juriste avant la mise en ligne.';

export interface LegalDoc { title: string; updated: string; sections: { title: string; body: string }[] }

const TERMS_FR: LegalDoc = {
  title: 'Conditions générales d’utilisation',
  updated: 'Novembre 2026',
  sections: [
    { title: 'Objet', body: 'HOMI est une application d’accompagnement des parents, du désir d’enfant à la vie de famille. Elle aide à noter, organiser et s’informer. Elle ne remplace en aucun cas l’avis d’un professionnel de santé.' },
    { title: 'Âge minimum', body: 'L’application est réservée aux personnes de 18 ans ou plus.' },
    { title: 'Compte', body: 'Vous êtes responsable de la confidentialité de vos identifiants. Vous pouvez supprimer votre compte à tout moment depuis Profil › Mon compte : vos données et vos photos sont alors effacées.' },
    { title: 'Informations de santé', body: 'Les contenus et l’assistant fournissent une information générale, sourcée et prudente. Ils ne posent pas de diagnostic, ne prescrivent pas et ne calculent pas de dose. En cas d’urgence, appelez le 15 ou le 112.' },
    { title: 'Communauté', body: 'Les échanges doivent rester bienveillants. Les messages contraires à la loi ou à ces règles peuvent être retirés et leurs auteurs suspendus.' },
    { title: 'Abonnement', body: 'Certaines fonctions sont réservées à l’abonnement Premium, géré par l’App Store ou Google Play. La résiliation se fait depuis les réglages de votre store. Les informations de sécurité restent toujours accessibles gratuitement.' },
    { title: 'Prix, essai et renouvellement', body: 'HOMI Premium est proposé en trois formules qui donnent exactement le même accès : mensuelle (10,99 € par mois), 6 mois (49,99 € tous les 6 mois) et 12 mois (79,99 € par an), prix indicatifs en France à la date de ces conditions. Le prix qui fait foi est celui affiché dans l’application tel que transmis par votre store (App Store ou Google Play), taxes comprises, et confirmé par le store avant tout paiement. Un essai gratuit de 3 jours n’est proposé que sur la formule mensuelle, et seulement si votre store indique que vous y avez droit (en général une seule fois) ; sinon le paiement commence dès la souscription. Aucun essai n’est proposé sur les formules 6 mois et 12 mois. L’abonnement se renouvelle automatiquement pour la même durée, sauf résiliation au moins 24 heures avant la fin de la période en cours, depuis les réglages de votre compte Apple ou Google ; l’accès reste ouvert jusqu’à la fin de la période payée. Changer de formule remplace l’abonnement en cours (jamais deux abonnements) ; une formule plus courte prend effet à l’échéance. Le remboursement éventuel est décidé par le store selon ses propres règles ; un abonnement remboursé met fin immédiatement à l’accès Premium.' },
    { title: 'Partage familial', body: 'Un abonnement Premium profite à la personne abonnée et à un seul autre adulte co-parent de son foyer (deux comptes adultes au maximum). Les accompagnants (nounou, grands-parents…) n’en bénéficient pas.' },
    { title: 'Supprimer son compte ≠ résilier', body: 'Supprimer votre compte HOMI efface vos données mais n’arrête pas le paiement : la résiliation se fait toujours dans les réglages de votre store. Le bouton « Gérer mon abonnement » (Profil › Mon abonnement) y mène directement.' },
    { title: 'Données des enfants', body: 'Les enfants n’ont pas de compte. Les informations et photos les concernant sont saisies par un parent ou une personne autorisée du foyer, qui en reste responsable vis-à-vis des autres titulaires de l’autorité parentale.' },
    { title: 'Responsabilité', body: 'L’éditeur met tout en œuvre pour fournir une information fiable et à jour, sans pouvoir garantir l’absence d’erreur. Vérifiez toujours les indications des emballages, des notices et de votre professionnel de santé.' },
    { title: 'Droit applicable', body: 'Droit français. En cas de litige, une solution amiable sera recherchée avant toute action.' },
  ],
};

const PRIVACY_FR: LegalDoc = {
  title: 'Politique de confidentialité',
  updated: 'Novembre 2026',
  sections: [
    { title: 'Responsable du traitement', body: `David PRINCIVIL, éditeur de ${BRAND.name}, à titre personnel (particulier). Pour toute question ou pour exercer vos droits, écrivez à ${BRAND.supportEmail} : réponse dans un délai d’un mois au plus.` },
    { title: 'Base légale', body: 'Les données de santé (cycle, grossesse, santé des enfants, humeur, rapports) ne sont traitées qu’avec votre consentement explicite, enregistré et daté, que vous pouvez retirer à tout moment dans Profil › Confidentialité. Le compte, l’abonnement et la sécurité du service reposent sur l’exécution du contrat ; la conservation des factures (par Apple ou Google) sur une obligation légale.' },
    { title: 'Données collectées', body: 'Compte (e-mail), profil, informations que vous saisissez (grossesse, enfants, suivis, cycle), consentements horodatés. Les données de santé ne sont traitées qu’avec votre consentement explicite.' },
    { title: 'Finalités', body: 'Fournir les fonctions de l’application, vos rappels, le partage avec les membres de votre foyer selon les droits que vous choisissez, et la sécurité du service. Jamais de publicité ciblée, jamais de revente de vos données.' },
    { title: 'Qui peut voir vos données', body: 'Vous, et les membres de votre foyer selon les droits que vous leur donnez, domaine par domaine. Vos données personnelles (humeur, cycle, poids) ne sont partagées que si vous le choisissez. Dans la communauté, seul votre pseudonyme est visible. En mode démonstration, tout reste sur votre appareil.' },
    { title: 'Hébergement', body: 'Base de données hébergée par Supabase dans l’Union européenne (Irlande, serveurs Amazon Web Services de la région eu-west-1). Les fichiers et les comptes sont hébergés au même endroit. Les clés secrètes restent sur le serveur.' },
    { title: 'Intelligence artificielle', body: 'Certaines fonctions utilisent l’intelligence artificielle Google Gemini (offre payante de l’API), seulement si vous les activez ou les lancez : l’assistant (vos questions, sans nom ni e-mail), l’analyse des photos que vous choisissez d’envoyer, la lecture automatique d’un document que vous choisissez, l’explication d’un produit scanné, et, dans la communauté, le résumé ou la traduction d’une discussion (les messages publics de la discussion sont alors transmis). Les données sont envoyées depuis nos serveurs pour cette seule réponse. Ni HOMI ni Google ne les utilisent pour entraîner une IA ; Google peut toutefois les conserver jusqu’à 55 jours pour détecter les abus, avec une relecture humaine possible en cas de signalement. L’assistant conversationnel est actuellement suspendu (« bientôt disponible ») : aucune question ne lui est envoyée tant qu’il n’est pas rouvert.' },
    { title: 'Photos sensibles', body: 'Les photos de tests sont analysées sur votre téléphone et supprimées par défaut. Si vous choisissez de les garder, elles sont chiffrées sur le téléphone avant d’être enregistrées.' },
    { title: 'Album photo des enfants', body: 'Les photos ajoutées à l’album d’un enfant sont réduites sur votre téléphone et enregistrées sans leurs métadonnées (dont la position GPS), dans un espace privé jamais public. Elles ne sont visibles que par les membres du foyer qui ont accès au profil de cet enfant, ou par vous seule si vous choisissez « moi seulement ». L’affichage passe par des liens temporaires (1 heure). Elles ne sont envoyées à aucun service d’intelligence artificielle.' },
    { title: 'Services utilisés (sous-traitants)', body: 'Supabase : hébergement de la base, des fichiers et des comptes. Google (API Gemini) : réponses de l’assistant et analyses de photos que vous demandez. Google (Places) : recherche de lieux autour de vous, seulement quand vous la lancez (position envoyée pour cette recherche). Apple et Google : paiement de l’abonnement. RevenueCat : suivi de l’abonnement (identifiant de compte et achats, sans données de santé). Expo : acheminement des notifications (texte neutre, sans détail de santé). Resend : e-mails de connexion. Sentry : rapports de plantage, uniquement si vous l’acceptez, sans données personnelles. Open Food Facts et RappelConso : seul le code-barres scanné est transmis. OpenStreetMap (serveurs Overpass, dont un miroir tiers, cartes et photos Wikimedia Commons) : quand vous cherchez des lieux près de vous sans Google, votre téléphone contacte directement ces services, qui reçoivent votre adresse IP et une position arrondie. Plusieurs de ces sociétés sont établies aux États-Unis : les transferts de données hors de l’Union européenne reposent sur le cadre de protection des données UE–États-Unis (Data Privacy Framework) lorsque la société y adhère, sinon sur les clauses contractuelles types de la Commission européenne.' },
    { title: 'Notifications et écran verrouillé', body: 'Les notifications n’affichent ni nom de médicament, ni dose, ni détail de cycle ou de santé, ni pseudonyme de la communauté : le détail ne s’affiche qu’une fois l’application ouverte.' },
    { title: 'Sécurité', body: 'Accès contrôlé ligne par ligne sur le serveur (chaque personne ne voit que ses données et celles de son foyer qu’on lui a ouvertes), clés secrètes uniquement côté serveur, données intimes jamais conservées dans le cache du téléphone, photos de tests chiffrées, publications anonymes réellement anonymes, verrouillage par Face ID ou code possible.' },
    { title: 'Durée de conservation', body: 'Tant que votre compte existe. Vous pouvez supprimer chaque entrée à tout moment et indiquer une durée de conservation souhaitée dans Profil › Confidentialité. La suppression du compte efface définitivement vos données et vos fichiers, sauf ce que la loi impose de conserver (facturation, gérée par Apple ou Google).' },
    { title: 'Vos droits', body: 'Accès, rectification, effacement, portabilité (export JSON et PDF dans l’application), opposition et retrait du consentement à tout moment. Vous pouvez saisir la CNIL (cnil.fr).' },
  ],
};

// ---------------------------------------------------------------- English version (same sections, same order)
const LEGAL_DRAFT_NOTICE_EN = 'Draft — to be reviewed by a lawyer before going live.';

const TERMS_EN: LegalDoc = {
  title: 'Terms of use',
  updated: 'November 2026',
  sections: [
    { title: 'Purpose', body: 'HOMI is an app that supports parents, from the wish for a child through to family life. It helps you record, organise and find information. It never replaces the advice of a health professional.' },
    { title: 'Minimum age', body: 'The app is for people aged 18 or over.' },
    { title: 'Account', body: 'You are responsible for keeping your login details confidential. You can delete your account at any time from Profile › My account: your data and photos are then erased.' },
    { title: 'Health information', body: 'The content and the assistant provide general, sourced and cautious information. They do not make diagnoses, prescribe or calculate doses. In an emergency, call 15 or 112.' },
    { title: 'Community', body: 'Exchanges must remain kind and respectful. Messages that are against the law or these rules may be removed and their authors suspended.' },
    { title: 'Subscription', body: 'Some features are reserved for the Premium subscription, managed by the App Store or Google Play. You cancel from your store’s settings. Safety information always remains available free of charge.' },
    { title: 'Price, trial and renewal', body: 'HOMI Premium comes in three plans that give exactly the same access: monthly (€10.99 per month), 6 months (€49.99 every 6 months) and 12 months (€79.99 per year), indicative prices in France on the date of these terms. The price that applies is the one shown in the app as supplied by your store (App Store or Google Play), taxes included, and confirmed by the store before any payment. A 3-day free trial is offered only on the monthly plan, and only if your store indicates that you are eligible (usually once); otherwise payment starts as soon as you subscribe. No trial is offered on the 6-month and 12-month plans. The subscription renews automatically for the same period, unless cancelled at least 24 hours before the end of the current period, from your Apple or Google account settings; access stays open until the end of the paid period. Changing plan replaces the current subscription (never two subscriptions); a shorter plan takes effect at the renewal date. Any refund is decided by the store under its own rules; a refunded subscription ends Premium access immediately.' },
    { title: 'Family sharing', body: 'A Premium subscription benefits the subscriber and one other adult co-parent in their household (two adult accounts at most). Carers (nanny, grandparents…) do not benefit from it.' },
    { title: 'Deleting your account ≠ cancelling', body: 'Deleting your HOMI account erases your data but does not stop payment: cancellation is always done in your store’s settings. The “Manage my subscription” button (Profile › My subscription) takes you there directly.' },
    { title: 'Children’s data', body: 'Children do not have accounts. Information and photos about them are entered by a parent or an authorised person in the household, who remains responsible for it towards the other holders of parental authority.' },
    { title: 'Liability', body: 'The publisher does its best to provide reliable and up-to-date information, but cannot guarantee that it is free of errors. Always check the instructions on packaging, leaflets and from your health professional.' },
    { title: 'Governing law', body: 'French law applies. In the event of a dispute, an amicable solution will be sought before any legal action.' },
  ],
};

const PRIVACY_EN: LegalDoc = {
  title: 'Privacy policy',
  updated: 'November 2026',
  sections: [
    { title: 'Data controller', body: `David PRINCIVIL, publisher of ${BRAND.name}, as a private individual. For any question or to exercise your rights, write to ${BRAND.supportEmail}: you will get a reply within one month at most.` },
    { title: 'Legal basis', body: 'Health data (cycle, pregnancy, children’s health, mood, intercourse) is processed only with your explicit consent, recorded and dated, which you can withdraw at any time in Profile › Privacy. The account, the subscription and the security of the service rely on performance of the contract; the keeping of invoices (by Apple or Google) relies on a legal obligation.' },
    { title: 'Data collected', body: 'Account (email), profile, information you enter (pregnancy, children, tracking, cycle), time-stamped consents. Health data is processed only with your explicit consent.' },
    { title: 'Purposes', body: 'To provide the app’s features, your reminders, sharing with the members of your household according to the rights you choose, and the security of the service. Never targeted advertising, never resale of your data.' },
    { title: 'Who can see your data', body: 'You, and the members of your household according to the rights you give them, area by area. Your personal data (mood, cycle, weight) is shared only if you choose. In the community, only your pseudonym is visible. In demo mode, everything stays on your device.' },
    { title: 'Hosting', body: 'Database hosted by Supabase in the European Union (Ireland, Amazon Web Services servers in the eu-west-1 region). Files and accounts are hosted in the same place. Secret keys stay on the server.' },
    { title: 'Artificial intelligence', body: 'Some features use Google Gemini artificial intelligence (paid API tier), only if you turn them on or run them: the assistant (your questions, without name or email), analysis of photos you choose to send, automatic reading of a document you choose, explanation of a scanned product, and, in the community, the summary or translation of a discussion (the public messages of the discussion are then sent). The data is sent from our servers for that single response only. Neither HOMI nor Google uses it to train an AI; however, Google may keep it for up to 55 days to detect abuse, with possible human review if it is flagged. The conversational assistant is currently paused (“coming soon”): no question is sent to it until it reopens.' },
    { title: 'Sensitive photos', body: 'Test photos are analysed on your phone and deleted by default. If you choose to keep them, they are encrypted on the phone before being saved.' },
    { title: 'Children’s photo album', body: 'Photos added to a child’s album are reduced in size on your phone and saved without their metadata (including GPS location), in a private space that is never public. They can be seen only by the members of the household who have access to that child’s profile, or by you alone if you choose “only me”. They are displayed through temporary links (1 hour). They are not sent to any artificial intelligence service.' },
    { title: 'Services used (processors)', body: 'Supabase: hosting of the database, files and accounts. Google (Gemini API): assistant replies and photo analyses that you request. Google (Places): searching for places around you, only when you run it (location sent for that search). Apple and Google: payment for the subscription. RevenueCat: subscription tracking (account identifier and purchases, no health data). Expo: delivery of notifications (neutral text, no health detail). Resend: sign-in emails. Sentry: crash reports, only if you accept them, without personal data. Open Food Facts and RappelConso: only the scanned barcode is sent. OpenStreetMap (Overpass servers, including a third-party mirror, maps and Wikimedia Commons photos): when you search for places near you without Google, your phone contacts these services directly, and they receive your IP address and an approximate location. Several of these companies are based in the United States: transfers of data outside the European Union rely on the EU–US Data Privacy Framework where the company is certified, otherwise on the European Commission’s standard contractual clauses.' },
    { title: 'Notifications and lock screen', body: 'Notifications show no medicine name, no dose, no cycle or health detail, and no community pseudonym: the detail is shown only once the app is open.' },
    { title: 'Security', body: 'Row-by-row access control on the server (each person sees only their own data and the household data that has been opened to them), secret keys only on the server side, intimate data never kept in the phone’s cache, encrypted test photos, anonymous posts that are genuinely anonymous, optional Face ID or passcode lock.' },
    { title: 'Retention period', body: 'For as long as your account exists. You can delete each entry at any time and set a preferred retention period in Profile › Privacy. Deleting the account permanently erases your data and files, except what the law requires us to keep (billing, handled by Apple or Google).' },
    { title: 'Your rights', body: 'Access, rectification, erasure, portability (JSON and PDF export in the app), objection and withdrawal of consent at any time. You can complain to the CNIL (cnil.fr), the French data protection authority.' },
  ],
};

// ---------------------------------------------------------------- Versions espagnole, allemande et italienne
// (traduites depuis le français, mêmes sections, même ordre, même fond juridique). Elles restent dans ce fichier :
// c'est le seul, avec la grille des formules, où les prix peuvent être écrits (test subscriptionScenarios).
const LEGAL_DRAFT_NOTICE_ES = 'Borrador: debe validarlo un jurista antes de su publicación.';
const LEGAL_DRAFT_NOTICE_DE = 'Entwurf – vor der Veröffentlichung von einer juristischen Fachperson zu prüfen.';
const LEGAL_DRAFT_NOTICE_IT = 'Bozza: da far convalidare da un giurista prima della pubblicazione.';

const TERMS_ES: LegalDoc = {
  title: 'Condiciones generales de uso',
  updated: 'Noviembre de 2026',
  sections: [
    { title: 'Objeto', body: 'HOMI es una aplicación de acompañamiento para madres y padres, desde el deseo de tener un hijo hasta la vida en familia. Ayuda a anotar, organizar e informarse. En ningún caso sustituye la opinión de un profesional sanitario.' },
    { title: 'Edad mínima', body: 'La aplicación está reservada a personas de 18 años o más.' },
    { title: 'Cuenta', body: 'Eres responsable de la confidencialidad de tus datos de acceso. Puedes eliminar tu cuenta en cualquier momento desde Perfil › Mi cuenta: tus datos y tus fotos se borran entonces.' },
    { title: 'Información de salud', body: 'Los contenidos y el asistente ofrecen una información general, con fuentes y prudente. No establecen diagnósticos, no prescriben y no calculan dosis. En caso de urgencia, llama al 15 o al 112.' },
    { title: 'Comunidad', body: 'Los intercambios deben seguir siendo amables y respetuosos. Los mensajes contrarios a la ley o a estas normas pueden retirarse y sus autores pueden ser suspendidos.' },
    { title: 'Suscripción', body: 'Algunas funciones están reservadas a la suscripción Premium, gestionada por el App Store o Google Play. La cancelación se hace desde los ajustes de tu tienda de aplicaciones. La información de seguridad sigue siendo siempre accesible de forma gratuita.' },
    { title: 'Precio, prueba y renovación', body: 'HOMI Premium se ofrece en tres modalidades que dan exactamente el mismo acceso: mensual (10,99 € al mes), 6 meses (49,99 € cada 6 meses) y 12 meses (79,99 € al año), precios orientativos en Francia en la fecha de estas condiciones. El precio que prevalece es el que se muestra en la aplicación tal como lo transmite tu tienda (App Store o Google Play), impuestos incluidos, y que la tienda confirma antes de cualquier pago. Solo se ofrece una prueba gratuita de 3 días en la modalidad mensual, y únicamente si tu tienda indica que tienes derecho a ella (en general, una sola vez); si no, el pago empieza en el momento de la suscripción. No se ofrece ninguna prueba en las modalidades de 6 meses y 12 meses. La suscripción se renueva automáticamente por el mismo periodo, salvo cancelación al menos 24 horas antes del final del periodo en curso, desde los ajustes de tu cuenta de Apple o de Google; el acceso sigue abierto hasta el final del periodo pagado. Cambiar de modalidad sustituye la suscripción en curso (nunca dos suscripciones); una modalidad más corta se aplica al vencimiento. El posible reembolso lo decide la tienda según sus propias normas; una suscripción reembolsada pone fin inmediatamente al acceso Premium.' },
    { title: 'Uso compartido en familia', body: 'Una suscripción Premium beneficia a la persona suscrita y a un único adulto más de su hogar que sea coprogenitor (dos cuentas de adulto como máximo). Las personas que acompañan (niñera, abuelos…) no se benefician de ella.' },
    { title: 'Eliminar tu cuenta ≠ cancelar', body: 'Eliminar tu cuenta de HOMI borra tus datos, pero no detiene el pago: la cancelación se hace siempre en los ajustes de tu tienda de aplicaciones. El botón «Gestionar mi suscripción» (Perfil › Mi suscripción) te lleva directamente allí.' },
    { title: 'Datos de los niños', body: 'Los niños no tienen cuenta. La información y las fotos que les conciernen las introduce un padre, una madre o una persona autorizada del hogar, que sigue siendo responsable de ellas frente a los demás titulares de la autoridad parental.' },
    { title: 'Responsabilidad', body: 'El editor hace todo lo posible por ofrecer una información fiable y actualizada, sin poder garantizar la ausencia de errores. Comprueba siempre las indicaciones de los envases, de los prospectos y de tu profesional sanitario.' },
    { title: 'Derecho aplicable', body: 'Derecho francés. En caso de litigio, se buscará una solución amistosa antes de cualquier acción.' },
  ],
};

const PRIVACY_ES: LegalDoc = {
  title: 'Política de privacidad',
  updated: 'Noviembre de 2026',
  sections: [
    { title: 'Responsable del tratamiento', body: `David PRINCIVIL, editor de ${BRAND.name}, a título personal (particular). Para cualquier pregunta o para ejercer tus derechos, escribe a ${BRAND.supportEmail}: respuesta en un plazo máximo de un mes.` },
    { title: 'Base jurídica', body: 'Los datos de salud (ciclo, embarazo, salud de los niños, estado de ánimo, relaciones sexuales) solo se tratan con tu consentimiento explícito, registrado y fechado, que puedes retirar en cualquier momento en Perfil › Privacidad. La cuenta, la suscripción y la seguridad del servicio se basan en la ejecución del contrato; la conservación de las facturas (por Apple o Google), en una obligación legal.' },
    { title: 'Datos recopilados', body: 'Cuenta (correo electrónico), perfil, información que introduces (embarazo, hijos, seguimientos, ciclo), consentimientos con fecha y hora. Los datos de salud solo se tratan con tu consentimiento explícito.' },
    { title: 'Finalidades', body: 'Ofrecer las funciones de la aplicación, tus recordatorios, el uso compartido con los miembros de tu hogar según los derechos que elijas, y la seguridad del servicio. Nunca publicidad dirigida, nunca reventa de tus datos.' },
    { title: 'Quién puede ver tus datos', body: 'Tú y los miembros de tu hogar según los derechos que les des, ámbito por ámbito. Tus datos personales (estado de ánimo, ciclo, peso) solo se comparten si tú lo eliges. En la comunidad, solo es visible tu seudónimo. En el modo demostración, todo se queda en tu dispositivo.' },
    { title: 'Alojamiento', body: 'Base de datos alojada por Supabase en la Unión Europea (Irlanda, servidores de Amazon Web Services de la región eu-west-1). Los archivos y las cuentas se alojan en el mismo lugar. Las claves secretas permanecen en el servidor.' },
    { title: 'Inteligencia artificial', body: 'Algunas funciones utilizan la inteligencia artificial Google Gemini (oferta de pago de la API), solo si las activas o las inicias: el asistente (tus preguntas, sin nombre ni correo electrónico), el análisis de las fotos que eliges enviar, la lectura automática de un documento que eliges, la explicación de un producto escaneado y, en la comunidad, el resumen o la traducción de una conversación (en ese caso se transmiten los mensajes públicos de la conversación). Los datos se envían desde nuestros servidores únicamente para esa respuesta. Ni HOMI ni Google los utilizan para entrenar una IA; no obstante, Google puede conservarlos hasta 55 días para detectar abusos, con una posible revisión humana en caso de denuncia. El asistente conversacional está suspendido por ahora («próximamente»): no se le envía ninguna pregunta hasta que vuelva a abrirse.' },
    { title: 'Fotos sensibles', body: 'Las fotos de pruebas se analizan en tu teléfono y se eliminan por defecto. Si eliges conservarlas, se cifran en el teléfono antes de guardarse.' },
    { title: 'Álbum de fotos de los niños', body: 'Las fotos añadidas al álbum de un niño se reducen en tu teléfono y se guardan sin sus metadatos (incluida la ubicación GPS), en un espacio privado que nunca es público. Solo pueden verlas los miembros del hogar que tienen acceso al perfil de ese niño, o solo tú si eliges «solo yo». Se muestran mediante enlaces temporales (1 hora). No se envían a ningún servicio de inteligencia artificial.' },
    { title: 'Servicios utilizados (encargados del tratamiento)', body: 'Supabase: alojamiento de la base de datos, los archivos y las cuentas. Google (API Gemini): respuestas del asistente y análisis de fotos que solicitas. Google (Places): búsqueda de lugares a tu alrededor, solo cuando la inicias (ubicación enviada para esa búsqueda). Apple y Google: pago de la suscripción. RevenueCat: seguimiento de la suscripción (identificador de cuenta y compras, sin datos de salud). Expo: envío de las notificaciones (texto neutro, sin detalles de salud). Resend: correos electrónicos de inicio de sesión. Sentry: informes de fallos, solo si los aceptas, sin datos personales. Open Food Facts y RappelConso: solo se transmite el código de barras escaneado. OpenStreetMap (servidores Overpass, entre ellos un espejo de terceros, mapas y fotos de Wikimedia Commons): cuando buscas lugares cerca de ti sin Google, tu teléfono contacta directamente con estos servicios, que reciben tu dirección IP y una ubicación redondeada. Varias de estas empresas tienen su sede en Estados Unidos: las transferencias de datos fuera de la Unión Europea se basan en el Marco de Privacidad de Datos UE-EE. UU. (Data Privacy Framework) cuando la empresa está adherida y, si no, en las cláusulas contractuales tipo de la Comisión Europea.' },
    { title: 'Notificaciones y pantalla bloqueada', body: 'Las notificaciones no muestran ni nombre de medicamento, ni dosis, ni detalles del ciclo o de salud, ni seudónimo de la comunidad: el detalle solo se muestra una vez abierta la aplicación.' },
    { title: 'Seguridad', body: 'Acceso controlado fila por fila en el servidor (cada persona solo ve sus datos y los de su hogar que se le han abierto), claves secretas únicamente en el servidor, datos íntimos nunca conservados en la caché del teléfono, fotos de pruebas cifradas, publicaciones anónimas realmente anónimas, posible bloqueo con Face ID o código.' },
    { title: 'Plazo de conservación', body: 'Mientras exista tu cuenta. Puedes eliminar cada entrada en cualquier momento e indicar el plazo de conservación que deseas en Perfil › Privacidad. La eliminación de la cuenta borra definitivamente tus datos y tus archivos, salvo lo que la ley obliga a conservar (facturación, gestionada por Apple o Google).' },
    { title: 'Tus derechos', body: 'Acceso, rectificación, supresión, portabilidad (exportación JSON y PDF en la aplicación), oposición y retirada del consentimiento en cualquier momento. Puedes presentar una reclamación ante la CNIL (cnil.fr), la autoridad francesa de protección de datos.' },
  ],
};

const TERMS_DE: LegalDoc = {
  title: 'Allgemeine Nutzungsbedingungen',
  updated: 'November 2026',
  sections: [
    { title: 'Gegenstand', body: 'HOMI ist eine App, die Eltern begleitet – vom Kinderwunsch bis zum Familienleben. Sie hilft beim Notieren, Organisieren und Informieren. Sie ersetzt in keinem Fall den Rat einer medizinischen Fachperson.' },
    { title: 'Mindestalter', body: 'Die App ist Personen ab 18 Jahren vorbehalten.' },
    { title: 'Konto', body: 'Du bist für die Vertraulichkeit deiner Zugangsdaten verantwortlich. Du kannst dein Konto jederzeit unter Profil › Mein Konto löschen: Deine Daten und Fotos werden dann gelöscht.' },
    { title: 'Gesundheitsinformationen', body: 'Die Inhalte und der Assistent liefern allgemeine, belegte und vorsichtige Informationen. Sie stellen keine Diagnose, verschreiben nichts und berechnen keine Dosis. Im Notfall rufe die 15 oder die 112 an.' },
    { title: 'Community', body: 'Der Austausch muss freundlich und respektvoll bleiben. Nachrichten, die gegen das Gesetz oder diese Regeln verstoßen, können entfernt und ihre Verfasser gesperrt werden.' },
    { title: 'Abonnement', body: 'Einige Funktionen sind dem Premium-Abonnement vorbehalten, das über den App Store oder Google Play verwaltet wird. Die Kündigung erfolgt in den Einstellungen deines Stores. Sicherheitsinformationen bleiben immer kostenlos zugänglich.' },
    { title: 'Preis, Testphase und Verlängerung', body: 'HOMI Premium wird in drei Varianten angeboten, die genau denselben Zugang bieten: monatlich (10,99 € pro Monat), 6 Monate (49,99 € alle 6 Monate) und 12 Monate (79,99 € pro Jahr); Richtpreise in Frankreich zum Datum dieser Bedingungen. Maßgeblich ist der Preis, der in der App so angezeigt wird, wie er von deinem Store (App Store oder Google Play) übermittelt wird, inklusive Steuern, und den der Store vor jeder Zahlung bestätigt. Eine kostenlose Testphase von 3 Tagen wird nur für die Monatsvariante angeboten, und nur wenn dein Store angibt, dass du Anspruch darauf hast (in der Regel ein einziges Mal); andernfalls beginnt die Zahlung mit dem Abschluss. Für die Varianten 6 Monate und 12 Monate wird keine Testphase angeboten. Das Abonnement verlängert sich automatisch um denselben Zeitraum, sofern es nicht mindestens 24 Stunden vor Ende des laufenden Zeitraums in den Einstellungen deines Apple- oder Google-Kontos gekündigt wird; der Zugang bleibt bis zum Ende des bezahlten Zeitraums bestehen. Ein Wechsel der Variante ersetzt das laufende Abonnement (niemals zwei Abonnements); eine kürzere Variante gilt ab dem Ablaufdatum. Über eine eventuelle Erstattung entscheidet der Store nach seinen eigenen Regeln; ein erstattetes Abonnement beendet den Premium-Zugang sofort.' },
    { title: 'Familienfreigabe', body: 'Ein Premium-Abonnement gilt für die abonnierende Person und eine einzige weitere erwachsene Person, die Mit-Elternteil im selben Haushalt ist (höchstens zwei Erwachsenenkonten). Betreuungspersonen (Kinderbetreuung, Großeltern …) profitieren nicht davon.' },
    { title: 'Konto löschen ≠ kündigen', body: 'Das Löschen deines Au-fil-de-nous-Kontos löscht deine Daten, stoppt aber nicht die Zahlung: Die Kündigung erfolgt immer in den Einstellungen deines Stores. Die Schaltfläche „Mein Abonnement verwalten“ (Profil › Mein Abonnement) führt dich direkt dorthin.' },
    { title: 'Daten der Kinder', body: 'Kinder haben kein Konto. Informationen und Fotos, die sie betreffen, werden von einem Elternteil oder einer berechtigten Person des Haushalts eingegeben, die dafür gegenüber den anderen Inhabern der elterlichen Sorge verantwortlich bleibt.' },
    { title: 'Haftung', body: 'Der Herausgeber setzt alles daran, verlässliche und aktuelle Informationen bereitzustellen, kann jedoch nicht garantieren, dass sie fehlerfrei sind. Prüfe immer die Angaben auf Verpackungen, in Beipackzetteln und von deiner medizinischen Fachperson.' },
    { title: 'Anwendbares Recht', body: 'Es gilt französisches Recht. Im Streitfall wird vor jedem rechtlichen Schritt eine gütliche Lösung angestrebt.' },
  ],
};

const PRIVACY_DE: LegalDoc = {
  title: 'Datenschutzerklärung',
  updated: 'November 2026',
  sections: [
    { title: 'Verantwortlicher', body: `David PRINCIVIL, Herausgeber von ${BRAND.name}, als Privatperson. Für alle Fragen oder zur Ausübung deiner Rechte schreibe an ${BRAND.supportEmail}: Antwort innerhalb von höchstens einem Monat.` },
    { title: 'Rechtsgrundlage', body: 'Gesundheitsdaten (Zyklus, Schwangerschaft, Gesundheit der Kinder, Stimmung, Geschlechtsverkehr) werden nur mit deiner ausdrücklichen, gespeicherten und datierten Einwilligung verarbeitet, die du jederzeit unter Profil › Datenschutz widerrufen kannst. Konto, Abonnement und die Sicherheit des Dienstes beruhen auf der Vertragserfüllung; die Aufbewahrung der Rechnungen (durch Apple oder Google) auf einer gesetzlichen Pflicht.' },
    { title: 'Erhobene Daten', body: 'Konto (E-Mail), Profil, Informationen, die du eingibst (Schwangerschaft, Kinder, Aufzeichnungen, Zyklus), Einwilligungen mit Zeitstempel. Gesundheitsdaten werden nur mit deiner ausdrücklichen Einwilligung verarbeitet.' },
    { title: 'Zwecke', body: 'Bereitstellung der Funktionen der App, deiner Erinnerungen, der Freigabe für die Mitglieder deines Haushalts gemäß den von dir gewählten Rechten sowie die Sicherheit des Dienstes. Niemals gezielte Werbung, niemals Weiterverkauf deiner Daten.' },
    { title: 'Wer deine Daten sehen kann', body: 'Du und die Mitglieder deines Haushalts gemäß den Rechten, die du ihnen gibst, Bereich für Bereich. Deine persönlichen Daten (Stimmung, Zyklus, Gewicht) werden nur geteilt, wenn du es entscheidest. In der Community ist nur dein Pseudonym sichtbar. Im Demomodus bleibt alles auf deinem Gerät.' },
    { title: 'Hosting', body: 'Datenbank gehostet von Supabase in der Europäischen Union (Irland, Server von Amazon Web Services in der Region eu-west-1). Dateien und Konten werden am selben Ort gehostet. Die geheimen Schlüssel bleiben auf dem Server.' },
    { title: 'Künstliche Intelligenz', body: 'Einige Funktionen nutzen die künstliche Intelligenz Google Gemini (kostenpflichtiges Angebot der API), nur wenn du sie aktivierst oder startest: den Assistenten (deine Fragen, ohne Namen und E-Mail), die Analyse der Fotos, die du senden möchtest, das automatische Lesen eines von dir gewählten Dokuments, die Erklärung eines gescannten Produkts und, in der Community, die Zusammenfassung oder Übersetzung einer Diskussion (dabei werden die öffentlichen Nachrichten der Diskussion übermittelt). Die Daten werden von unseren Servern nur für diese eine Antwort gesendet. Weder HOMI noch Google nutzen sie zum Training einer KI; Google kann sie jedoch bis zu 55 Tage lang aufbewahren, um Missbrauch zu erkennen, wobei bei einer Meldung eine Prüfung durch Menschen möglich ist. Der Chat-Assistent ist derzeit pausiert („bald verfügbar“): Ihm werden keine Fragen gesendet, bis er wieder geöffnet wird.' },
    { title: 'Sensible Fotos', body: 'Fotos von Tests werden auf deinem Handy analysiert und standardmäßig gelöscht. Wenn du sie behalten möchtest, werden sie auf dem Handy verschlüsselt, bevor sie gespeichert werden.' },
    { title: 'Fotoalbum der Kinder', body: 'Fotos, die dem Album eines Kindes hinzugefügt werden, werden auf deinem Handy verkleinert und ohne ihre Metadaten (einschließlich GPS-Standort) in einem privaten, niemals öffentlichen Bereich gespeichert. Sie sind nur für die Mitglieder des Haushalts sichtbar, die Zugriff auf das Profil dieses Kindes haben, oder nur für dich, wenn du „nur ich“ wählst. Die Anzeige erfolgt über zeitlich begrenzte Links (1 Stunde). Sie werden an keinen Dienst für künstliche Intelligenz gesendet.' },
    { title: 'Genutzte Dienste (Auftragsverarbeiter)', body: 'Supabase: Hosting der Datenbank, der Dateien und der Konten. Google (Gemini-API): Antworten des Assistenten und von dir angeforderte Fotoanalysen. Google (Places): Suche nach Orten in deiner Nähe, nur wenn du sie startest (Standort wird für diese Suche gesendet). Apple und Google: Bezahlung des Abonnements. RevenueCat: Verwaltung des Abonnements (Kontokennung und Käufe, ohne Gesundheitsdaten). Expo: Zustellung der Benachrichtigungen (neutraler Text, ohne Gesundheitsdetails). Resend: Anmelde-E-Mails. Sentry: Absturzberichte, nur wenn du zustimmst, ohne personenbezogene Daten. Open Food Facts und RappelConso: Nur der gescannte Strichcode wird übermittelt. OpenStreetMap (Overpass-Server, darunter ein Spiegelserver eines Drittanbieters, Karten und Fotos von Wikimedia Commons): Wenn du ohne Google nach Orten in deiner Nähe suchst, kontaktiert dein Handy diese Dienste direkt, und sie erhalten deine IP-Adresse und einen gerundeten Standort. Mehrere dieser Unternehmen haben ihren Sitz in den USA: Datenübermittlungen außerhalb der Europäischen Union stützen sich auf den EU-US-Datenschutzrahmen (Data Privacy Framework), sofern das Unternehmen zertifiziert ist, andernfalls auf die Standardvertragsklauseln der Europäischen Kommission.' },
    { title: 'Benachrichtigungen und Sperrbildschirm', body: 'Benachrichtigungen zeigen weder den Namen eines Medikaments noch eine Dosis, keine Zyklus- oder Gesundheitsdetails und kein Community-Pseudonym: Die Details werden erst angezeigt, wenn die App geöffnet ist.' },
    { title: 'Sicherheit', body: 'Zeilenweise Zugriffskontrolle auf dem Server (jede Person sieht nur ihre eigenen Daten und die für sie freigegebenen Daten ihres Haushalts), geheime Schlüssel nur auf dem Server, intime Daten werden nie im Cache des Handys gespeichert, verschlüsselte Testfotos, anonyme Beiträge, die wirklich anonym sind, optionale Sperre per Face ID oder Code.' },
    { title: 'Speicherdauer', body: 'Solange dein Konto besteht. Du kannst jeden Eintrag jederzeit löschen und unter Profil › Datenschutz eine gewünschte Speicherdauer angeben. Das Löschen des Kontos löscht deine Daten und Dateien endgültig, außer dem, was gesetzlich aufbewahrt werden muss (Abrechnung, verwaltet von Apple oder Google).' },
    { title: 'Deine Rechte', body: 'Auskunft, Berichtigung, Löschung, Datenübertragbarkeit (Export als JSON und PDF in der App), Widerspruch und Widerruf der Einwilligung jederzeit. Du kannst dich an die CNIL (cnil.fr), die französische Datenschutzbehörde, wenden.' },
  ],
};

const TERMS_IT: LegalDoc = {
  title: 'Condizioni generali di utilizzo',
  updated: 'Novembre 2026',
  sections: [
    { title: 'Oggetto', body: 'HOMI è un’app che accompagna i genitori, dal desiderio di un figlio alla vita di famiglia. Aiuta ad annotare, organizzare e informarsi. Non sostituisce in alcun caso il parere di un professionista sanitario.' },
    { title: 'Età minima', body: 'L’app è riservata alle persone di 18 anni o più.' },
    { title: 'Account', body: 'Sei responsabile della riservatezza delle tue credenziali. Puoi eliminare il tuo account in qualsiasi momento da Profilo › Il mio account: i tuoi dati e le tue foto vengono allora cancellati.' },
    { title: 'Informazioni sulla salute', body: 'I contenuti e l’assistente forniscono un’informazione generale, con fonti e prudente. Non formulano diagnosi, non prescrivono e non calcolano dosi. In caso di emergenza, chiama il 15 o il 112.' },
    { title: 'Community', body: 'Gli scambi devono restare gentili e rispettosi. I messaggi contrari alla legge o a queste regole possono essere rimossi e i loro autori sospesi.' },
    { title: 'Abbonamento', body: 'Alcune funzioni sono riservate all’abbonamento Premium, gestito dall’App Store o da Google Play. La disdetta si effettua dalle impostazioni del tuo store. Le informazioni di sicurezza restano sempre accessibili gratuitamente.' },
    { title: 'Prezzo, prova e rinnovo', body: 'HOMI Premium è proposto in tre formule che danno esattamente lo stesso accesso: mensile (10,99 € al mese), 6 mesi (49,99 € ogni 6 mesi) e 12 mesi (79,99 € all’anno), prezzi indicativi in Francia alla data di queste condizioni. Fa fede il prezzo mostrato nell’app così come trasmesso dal tuo store (App Store o Google Play), tasse incluse, e confermato dallo store prima di qualsiasi pagamento. Una prova gratuita di 3 giorni è proposta solo sulla formula mensile, e solo se il tuo store indica che ne hai diritto (in genere una sola volta); altrimenti il pagamento inizia al momento della sottoscrizione. Nessuna prova è proposta sulle formule 6 mesi e 12 mesi. L’abbonamento si rinnova automaticamente per la stessa durata, salvo disdetta almeno 24 ore prima della fine del periodo in corso, dalle impostazioni del tuo account Apple o Google; l’accesso resta aperto fino alla fine del periodo pagato. Cambiare formula sostituisce l’abbonamento in corso (mai due abbonamenti); una formula più breve ha effetto alla scadenza. L’eventuale rimborso è deciso dallo store secondo le proprie regole; un abbonamento rimborsato pone fine immediatamente all’accesso Premium.' },
    { title: 'Condivisione in famiglia', body: 'Un abbonamento Premium vale per la persona abbonata e per un solo altro adulto co-genitore del suo nucleo familiare (al massimo due account adulti). Le persone che aiutano (tata, nonni…) non ne beneficiano.' },
    { title: 'Eliminare l’account ≠ disdire', body: 'Eliminare il tuo account HOMI cancella i tuoi dati ma non interrompe il pagamento: la disdetta si effettua sempre nelle impostazioni del tuo store. Il pulsante «Gestisci il mio abbonamento» (Profilo › Il mio abbonamento) ti porta direttamente lì.' },
    { title: 'Dati dei bambini', body: 'I bambini non hanno un account. Le informazioni e le foto che li riguardano sono inserite da un genitore o da una persona autorizzata del nucleo familiare, che ne resta responsabile nei confronti degli altri titolari della responsabilità genitoriale.' },
    { title: 'Responsabilità', body: 'L’editore fa il possibile per fornire un’informazione affidabile e aggiornata, senza poter garantire l’assenza di errori. Verifica sempre le indicazioni delle confezioni, dei foglietti illustrativi e del tuo professionista sanitario.' },
    { title: 'Legge applicabile', body: 'Legge francese. In caso di controversia, si cercherà una soluzione amichevole prima di qualsiasi azione.' },
  ],
};

const PRIVACY_IT: LegalDoc = {
  title: 'Informativa sulla privacy',
  updated: 'Novembre 2026',
  sections: [
    { title: 'Titolare del trattamento', body: `David PRINCIVIL, editore di ${BRAND.name}, a titolo personale (privato). Per qualsiasi domanda o per esercitare i tuoi diritti, scrivi a ${BRAND.supportEmail}: risposta entro un mese al massimo.` },
    { title: 'Base giuridica', body: 'I dati sanitari (ciclo, gravidanza, salute dei bambini, umore, rapporti) sono trattati solo con il tuo consenso esplicito, registrato e datato, che puoi revocare in qualsiasi momento in Profilo › Privacy. L’account, l’abbonamento e la sicurezza del servizio si basano sull’esecuzione del contratto; la conservazione delle fatture (da parte di Apple o Google) su un obbligo di legge.' },
    { title: 'Dati raccolti', body: 'Account (e-mail), profilo, informazioni che inserisci (gravidanza, figli, monitoraggi, ciclo), consensi con data e ora. I dati sanitari sono trattati solo con il tuo consenso esplicito.' },
    { title: 'Finalità', body: 'Fornire le funzioni dell’app, i tuoi promemoria, la condivisione con i membri del tuo nucleo familiare secondo i diritti che scegli, e la sicurezza del servizio. Mai pubblicità mirata, mai rivendita dei tuoi dati.' },
    { title: 'Chi può vedere i tuoi dati', body: 'Tu e i membri del tuo nucleo familiare secondo i diritti che dai loro, ambito per ambito. I tuoi dati personali (umore, ciclo, peso) sono condivisi solo se lo scegli tu. Nella community è visibile solo il tuo pseudonimo. In modalità dimostrazione, tutto resta sul tuo dispositivo.' },
    { title: 'Hosting', body: 'Database ospitato da Supabase nell’Unione europea (Irlanda, server Amazon Web Services della regione eu-west-1). I file e gli account sono ospitati nello stesso luogo. Le chiavi segrete restano sul server.' },
    { title: 'Intelligenza artificiale', body: 'Alcune funzioni utilizzano l’intelligenza artificiale Google Gemini (offerta a pagamento dell’API), solo se le attivi o le avvii: l’assistente (le tue domande, senza nome né e-mail), l’analisi delle foto che scegli di inviare, la lettura automatica di un documento che scegli, la spiegazione di un prodotto scansionato e, nella community, il riassunto o la traduzione di una discussione (in tal caso vengono trasmessi i messaggi pubblici della discussione). I dati sono inviati dai nostri server solo per quella risposta. Né HOMI né Google li utilizzano per addestrare un’IA; Google può tuttavia conservarli fino a 55 giorni per individuare abusi, con una possibile revisione umana in caso di segnalazione. L’assistente conversazionale è al momento sospeso («presto disponibile»): non gli viene inviata alcuna domanda finché non riapre.' },
    { title: 'Foto sensibili', body: 'Le foto dei test vengono analizzate sul tuo telefono e cancellate per impostazione predefinita. Se scegli di conservarle, vengono cifrate sul telefono prima di essere salvate.' },
    { title: 'Album fotografico dei bambini', body: 'Le foto aggiunte all’album di un bambino vengono ridotte sul tuo telefono e salvate senza i loro metadati (compresa la posizione GPS), in uno spazio privato mai pubblico. Sono visibili solo ai membri del nucleo familiare che hanno accesso al profilo di quel bambino, oppure solo a te se scegli «solo io». La visualizzazione avviene tramite link temporanei (1 ora). Non vengono inviate a nessun servizio di intelligenza artificiale.' },
    { title: 'Servizi utilizzati (responsabili del trattamento)', body: 'Supabase: hosting del database, dei file e degli account. Google (API Gemini): risposte dell’assistente e analisi delle foto che richiedi. Google (Places): ricerca di luoghi intorno a te, solo quando la avvii (posizione inviata per quella ricerca). Apple e Google: pagamento dell’abbonamento. RevenueCat: gestione dell’abbonamento (identificativo dell’account e acquisti, senza dati sanitari). Expo: invio delle notifiche (testo neutro, senza dettagli sanitari). Resend: e-mail di accesso. Sentry: segnalazioni di arresti anomali, solo se le accetti, senza dati personali. Open Food Facts e RappelConso: viene trasmesso solo il codice a barre scansionato. OpenStreetMap (server Overpass, tra cui un mirror di terzi, mappe e foto di Wikimedia Commons): quando cerchi luoghi vicino a te senza Google, il tuo telefono contatta direttamente questi servizi, che ricevono il tuo indirizzo IP e una posizione arrotondata. Diverse di queste società hanno sede negli Stati Uniti: i trasferimenti di dati al di fuori dell’Unione europea si basano sul quadro UE-USA per la protezione dei dati (Data Privacy Framework) quando la società vi aderisce, altrimenti sulle clausole contrattuali tipo della Commissione europea.' },
    { title: 'Notifiche e schermata di blocco', body: 'Le notifiche non mostrano né nome di farmaco, né dose, né dettagli sul ciclo o sulla salute, né pseudonimo della community: il dettaglio compare solo una volta aperta l’app.' },
    { title: 'Sicurezza', body: 'Accesso controllato riga per riga sul server (ogni persona vede solo i propri dati e quelli del suo nucleo familiare che le sono stati aperti), chiavi segrete solo lato server, dati intimi mai conservati nella cache del telefono, foto dei test cifrate, pubblicazioni anonime realmente anonime, blocco con Face ID o codice possibile.' },
    { title: 'Durata di conservazione', body: 'Finché il tuo account esiste. Puoi eliminare ogni voce in qualsiasi momento e indicare una durata di conservazione desiderata in Profilo › Privacy. L’eliminazione dell’account cancella definitivamente i tuoi dati e i tuoi file, salvo ciò che la legge impone di conservare (fatturazione, gestita da Apple o Google).' },
    { title: 'I tuoi diritti', body: 'Accesso, rettifica, cancellazione, portabilità (esportazione JSON e PDF nell’app), opposizione e revoca del consenso in qualsiasi momento. Puoi rivolgerti alla CNIL (cnil.fr), l’autorità francese per la protezione dei dati.' },
  ],
};

const DRAFT_NOTICE = () => inLang({ fr: LEGAL_DRAFT_NOTICE_FR, en: LEGAL_DRAFT_NOTICE_EN, es: LEGAL_DRAFT_NOTICE_ES, de: LEGAL_DRAFT_NOTICE_DE, it: LEGAL_DRAFT_NOTICE_IT });
export let LEGAL_DRAFT_NOTICE = DRAFT_NOTICE();
export const TERMS: LegalDoc = localized(TERMS_FR, TERMS_EN, { es: TERMS_ES, de: TERMS_DE, it: TERMS_IT });
export const PRIVACY: LegalDoc = localized(PRIVACY_FR, PRIVACY_EN, { es: PRIVACY_ES, de: PRIVACY_DE, it: PRIVACY_IT });

// ---------------------------------------------------------------- Mentions légales, suppression du compte, aide (10/11/2026)
const NOTICE_FR: LegalDoc = {
  title: `Mentions légales`,
  updated: `Novembre 2026`,
  sections: [
    { title: `Éditeur`, body: `${BRAND.name} est éditée par David PRINCIVIL, à titre personnel (particulier). Contact : ${BRAND.supportEmail}.` },
    { title: `Directeur de la publication`, body: `David PRINCIVIL.` },
    { title: `Hébergement des données`, body: `Supabase, Inc. (supabase.com) : base de données, fichiers et comptes. Les autres services techniques utilisés sont listés dans la politique de confidentialité.` },
    { title: `Distribution`, body: `${BRAND.name} est distribuée par l’App Store (Apple) et Google Play (Google). Les paiements sont encaissés par ces boutiques.` },
    { title: `Propriété intellectuelle`, body: `Le nom ${BRAND.name}, le logo, les textes, les illustrations et l’organisation de l’application appartiennent à l’éditeur. Toute reproduction sans accord écrit est interdite. Les sources scientifiques et les bases ouvertes utilisées sont citées dans l’application (rubrique Sources).` },
    { title: `Signaler un contenu`, body: `Un message ou un contenu illicite peut être signalé depuis l’application (bouton « Signaler ») ou par e-mail à ${BRAND.supportEmail}. Il est examiné dans les meilleurs délais.` },
  ],
};

const DELETION_FR: LegalDoc = {
  title: `Supprimer mon compte`,
  updated: `Novembre 2026`,
  sections: [
    { title: `Depuis l’application`, body: `Profil › Mon compte › Supprimer mon compte. La suppression est immédiate et définitive.` },
    { title: `Sans l’application`, body: `Écrivez à ${BRAND.supportEmail} depuis l’adresse e-mail de votre compte, avec pour objet « Suppression de compte ». Nous répondons uniquement à cette adresse, pour vérifier qu’il s’agit bien de vous, et la suppression est faite dans un délai d’un mois au plus. Vous recevez une confirmation.` },
    { title: `Ce qui est effacé`, body: `Votre compte, vos saisies, vos photos et vos documents. Si votre foyer est partagé, les données du foyer restent au co-parent. Pour un compte « Se connecter avec Apple », l’accès de l’application à votre identifiant Apple est aussi révoqué.` },
    { title: `Ce qui n’est pas effacé`, body: `Les factures, conservées par Apple ou Google comme la loi l’impose. Supprimer le compte n’arrête pas l’abonnement : résiliez-le dans les réglages de votre compte Apple ou Google.` },
  ],
};

const SUPPORT_FR: LegalDoc = {
  title: `Aide et contact`,
  updated: `Novembre 2026`,
  sections: [
    { title: `Nous écrire`, body: `Une question, un problème, une suggestion : ${BRAND.supportEmail}. Vous pouvez aussi utiliser « Donner mon avis » dans Profil › Réglages.` },
    { title: `Urgence`, body: `L’équipe ne peut pas répondre aux urgences. Appelez le 15 (SAMU) ou le 112 ; en cas de détresse ou d’idées suicidaires, le 3114, gratuit, 24 h/24.` },
    { title: `Abonnement`, body: `La souscription, la résiliation et les remboursements se gèrent dans les réglages de votre compte Apple ou Google. Après un changement de téléphone : Profil › Mon abonnement › Restaurer mes achats.` },
    { title: `Vos données`, body: `Consultation, export et suppression : Profil › Confidentialité. Pour exercer vos droits par e-mail : ${BRAND.supportEmail}.` },
  ],
};

const NOTICE_EN: LegalDoc = {
  title: `Legal notice`,
  updated: `November 2026`,
  sections: [
    { title: `Publisher`, body: `${BRAND.name} is published by David PRINCIVIL, as a private individual. Contact: ${BRAND.supportEmail}.` },
    { title: `Publication director`, body: `David PRINCIVIL.` },
    { title: `Data hosting`, body: `Supabase, Inc. (supabase.com): database, files and accounts. The other technical services used are listed in the privacy policy.` },
    { title: `Distribution`, body: `${BRAND.name} is distributed through the App Store (Apple) and Google Play (Google). Payments are collected by these stores.` },
    { title: `Intellectual property`, body: `The name ${BRAND.name}, the logo, the texts, the illustrations and the organisation of the app belong to the publisher. Any reproduction without written consent is prohibited. The scientific sources and open databases used are cited in the app (Sources section).` },
    { title: `Reporting content`, body: `An unlawful message or content can be reported from the app (“Report” button) or by email to ${BRAND.supportEmail}. It is reviewed as quickly as possible.` },
  ],
};

const DELETION_EN: LegalDoc = {
  title: `Delete my account`,
  updated: `November 2026`,
  sections: [
    { title: `From the app`, body: `Profile › My account › Delete my account. Deletion is immediate and permanent.` },
    { title: `Without the app`, body: `Write to ${BRAND.supportEmail} from your account’s email address, with the subject “Account deletion”. We reply only to that address, to check that it is really you, and the deletion is carried out within one month at most. You receive a confirmation.` },
    { title: `What is erased`, body: `Your account, your entries, your photos and your documents. If your household is shared, the household data stays with the co-parent. For a “Sign in with Apple” account, the app’s access to your Apple ID is also revoked.` },
    { title: `What is not erased`, body: `Invoices, kept by Apple or Google as required by law. Deleting the account does not stop the subscription: cancel it in your Apple or Google account settings.` },
  ],
};

const SUPPORT_EN: LegalDoc = {
  title: `Help and contact`,
  updated: `November 2026`,
  sections: [
    { title: `Write to us`, body: `A question, a problem, a suggestion: ${BRAND.supportEmail}. You can also use “Give feedback” in Profile › Settings.` },
    { title: `Emergency`, body: `The team cannot respond to emergencies. In France, call 15 (SAMU) or 112; in distress or with suicidal thoughts, 3114, free, 24/7.` },
    { title: `Subscription`, body: `Subscribing, cancelling and refunds are handled in your Apple or Google account settings. After changing phone: Profile › My subscription › Restore purchases.` },
    { title: `Your data`, body: `Viewing, export and deletion: Profile › Privacy. To exercise your rights by email: ${BRAND.supportEmail}.` },
  ],
};

const NOTICE_ES: LegalDoc = {
  title: `Aviso legal`,
  updated: `Noviembre de 2026`,
  sections: [
    { title: `Editor`, body: `${BRAND.name} está editada por David PRINCIVIL, a título personal (particular). Contacto: ${BRAND.supportEmail}.` },
    { title: `Director de la publicación`, body: `David PRINCIVIL.` },
    { title: `Alojamiento de los datos`, body: `Supabase, Inc. (supabase.com): base de datos, archivos y cuentas. Los demás servicios técnicos utilizados se enumeran en la política de privacidad.` },
    { title: `Distribución`, body: `${BRAND.name} se distribuye a través del App Store (Apple) y Google Play (Google). Los pagos los cobran estas tiendas.` },
    { title: `Propiedad intelectual`, body: `El nombre ${BRAND.name}, el logotipo, los textos, las ilustraciones y la organización de la aplicación pertenecen al editor. Queda prohibida cualquier reproducción sin autorización por escrito. Las fuentes científicas y las bases abiertas utilizadas se citan en la aplicación (sección Fuentes).` },
    { title: `Denunciar un contenido`, body: `Un mensaje o contenido ilícito puede denunciarse desde la aplicación (botón «Denunciar») o por correo electrónico a ${BRAND.supportEmail}. Se examina lo antes posible.` },
  ],
};

const DELETION_ES: LegalDoc = {
  title: `Eliminar mi cuenta`,
  updated: `Noviembre de 2026`,
  sections: [
    { title: `Desde la aplicación`, body: `Perfil › Mi cuenta › Eliminar mi cuenta. La eliminación es inmediata y definitiva.` },
    { title: `Sin la aplicación`, body: `Escribe a ${BRAND.supportEmail} desde la dirección de correo de tu cuenta, con el asunto «Eliminación de cuenta». Solo respondemos a esa dirección, para comprobar que eres tú, y la eliminación se realiza en un plazo máximo de un mes. Recibirás una confirmación.` },
    { title: `Lo que se borra`, body: `Tu cuenta, tus anotaciones, tus fotos y tus documentos. Si tu hogar es compartido, los datos del hogar se quedan con el coprogenitor. En una cuenta «Iniciar sesión con Apple», también se revoca el acceso de la aplicación a tu ID de Apple.` },
    { title: `Lo que no se borra`, body: `Las facturas, que Apple o Google conservan como exige la ley. Eliminar la cuenta no detiene la suscripción: cancélala en los ajustes de tu cuenta de Apple o de Google.` },
  ],
};

const SUPPORT_ES: LegalDoc = {
  title: `Ayuda y contacto`,
  updated: `Noviembre de 2026`,
  sections: [
    { title: `Escríbenos`, body: `Una pregunta, un problema, una sugerencia: ${BRAND.supportEmail}. También puedes usar «Dar mi opinión» en Perfil › Ajustes.` },
    { title: `Urgencia`, body: `El equipo no puede atender urgencias. En Francia, llama al 15 (SAMU) o al 112; en caso de angustia o pensamientos suicidas, al 3114, gratuito, las 24 horas.` },
    { title: `Suscripción`, body: `La suscripción, la cancelación y los reembolsos se gestionan en los ajustes de tu cuenta de Apple o de Google. Tras cambiar de teléfono: Perfil › Mi suscripción › Restaurar compras.` },
    { title: `Tus datos`, body: `Consulta, exportación y eliminación: Perfil › Privacidad. Para ejercer tus derechos por correo: ${BRAND.supportEmail}.` },
  ],
};

const NOTICE_DE: LegalDoc = {
  title: `Impressum`,
  updated: `November 2026`,
  sections: [
    { title: `Herausgeber`, body: `${BRAND.name} wird von David PRINCIVIL als Privatperson herausgegeben. Kontakt: ${BRAND.supportEmail}.` },
    { title: `Verantwortlich für den Inhalt`, body: `David PRINCIVIL.` },
    { title: `Hosting der Daten`, body: `Supabase, Inc. (supabase.com): Datenbank, Dateien und Konten. Die weiteren genutzten technischen Dienste sind in der Datenschutzerklärung aufgeführt.` },
    { title: `Vertrieb`, body: `${BRAND.name} wird über den App Store (Apple) und Google Play (Google) vertrieben. Die Zahlungen werden von diesen Stores eingezogen.` },
    { title: `Geistiges Eigentum`, body: `Der Name ${BRAND.name}, das Logo, die Texte, die Illustrationen und der Aufbau der App gehören dem Herausgeber. Jede Vervielfältigung ohne schriftliche Zustimmung ist untersagt. Die genutzten wissenschaftlichen Quellen und offenen Datenbanken werden in der App genannt (Bereich Quellen).` },
    { title: `Inhalte melden`, body: `Rechtswidrige Nachrichten oder Inhalte können in der App (Schaltfläche „Melden“) oder per E-Mail an ${BRAND.supportEmail} gemeldet werden. Sie werden so schnell wie möglich geprüft.` },
  ],
};

const DELETION_DE: LegalDoc = {
  title: `Mein Konto löschen`,
  updated: `November 2026`,
  sections: [
    { title: `In der App`, body: `Profil › Mein Konto › Mein Konto löschen. Die Löschung erfolgt sofort und endgültig.` },
    { title: `Ohne die App`, body: `Schreibe von der E-Mail-Adresse deines Kontos an ${BRAND.supportEmail}, Betreff „Kontolöschung“. Wir antworten nur an diese Adresse, um zu prüfen, dass du es bist, und die Löschung erfolgt innerhalb von höchstens einem Monat. Du erhältst eine Bestätigung.` },
    { title: `Was gelöscht wird`, body: `Dein Konto, deine Einträge, deine Fotos und deine Dokumente. Wenn dein Haushalt geteilt ist, bleiben die Haushaltsdaten beim anderen Elternteil. Bei einem Konto mit „Mit Apple anmelden“ wird auch der Zugriff der App auf deine Apple-ID widerrufen.` },
    { title: `Was nicht gelöscht wird`, body: `Die Rechnungen, die Apple oder Google wie gesetzlich vorgeschrieben aufbewahren. Das Löschen des Kontos beendet das Abonnement nicht: Kündige es in den Einstellungen deines Apple- oder Google-Kontos.` },
  ],
};

const SUPPORT_DE: LegalDoc = {
  title: `Hilfe und Kontakt`,
  updated: `November 2026`,
  sections: [
    { title: `Schreib uns`, body: `Eine Frage, ein Problem, ein Vorschlag: ${BRAND.supportEmail}. Du kannst auch „Feedback geben“ unter Profil › Einstellungen nutzen.` },
    { title: `Notfall`, body: `Das Team kann nicht auf Notfälle reagieren. In Frankreich rufe die 15 (SAMU) oder die 112 an; bei seelischer Not oder Suizidgedanken die 3114, kostenlos, rund um die Uhr.` },
    { title: `Abonnement`, body: `Abschluss, Kündigung und Erstattungen werden in den Einstellungen deines Apple- oder Google-Kontos verwaltet. Nach einem Handywechsel: Profil › Mein Abonnement › Käufe wiederherstellen.` },
    { title: `Deine Daten`, body: `Ansehen, Export und Löschung: Profil › Datenschutz. Um deine Rechte per E-Mail auszuüben: ${BRAND.supportEmail}.` },
  ],
};

const NOTICE_IT: LegalDoc = {
  title: `Note legali`,
  updated: `Novembre 2026`,
  sections: [
    { title: `Editore`, body: `${BRAND.name} è pubblicata da David PRINCIVIL, a titolo personale (privato). Contatto: ${BRAND.supportEmail}.` },
    { title: `Direttore della pubblicazione`, body: `David PRINCIVIL.` },
    { title: `Hosting dei dati`, body: `Supabase, Inc. (supabase.com): database, file e account. Gli altri servizi tecnici utilizzati sono elencati nell’informativa sulla privacy.` },
    { title: `Distribuzione`, body: `${BRAND.name} è distribuita tramite l’App Store (Apple) e Google Play (Google). I pagamenti sono incassati da questi store.` },
    { title: `Proprietà intellettuale`, body: `Il nome ${BRAND.name}, il logo, i testi, le illustrazioni e l’organizzazione dell’app appartengono all’editore. È vietata qualsiasi riproduzione senza consenso scritto. Le fonti scientifiche e le banche dati aperte utilizzate sono citate nell’app (sezione Fonti).` },
    { title: `Segnalare un contenuto`, body: `Un messaggio o un contenuto illecito può essere segnalato dall’app (pulsante «Segnala») o via e-mail a ${BRAND.supportEmail}. Viene esaminato il prima possibile.` },
  ],
};

const DELETION_IT: LegalDoc = {
  title: `Eliminare il mio account`,
  updated: `Novembre 2026`,
  sections: [
    { title: `Dall’app`, body: `Profilo › Il mio account › Elimina il mio account. L’eliminazione è immediata e definitiva.` },
    { title: `Senza l’app`, body: `Scrivi a ${BRAND.supportEmail} dall’indirizzo e-mail del tuo account, con oggetto «Eliminazione account». Rispondiamo solo a quell’indirizzo, per verificare che sia proprio tu, e l’eliminazione avviene entro un mese al massimo. Riceverai una conferma.` },
    { title: `Cosa viene cancellato`, body: `Il tuo account, le tue annotazioni, le tue foto e i tuoi documenti. Se il tuo nucleo familiare è condiviso, i dati del nucleo restano al co-genitore. Per un account «Accedi con Apple», viene revocato anche l’accesso dell’app al tuo ID Apple.` },
    { title: `Cosa non viene cancellato`, body: `Le fatture, conservate da Apple o Google come impone la legge. Eliminare l’account non interrompe l’abbonamento: disdicilo nelle impostazioni del tuo account Apple o Google.` },
  ],
};

const SUPPORT_IT: LegalDoc = {
  title: `Aiuto e contatti`,
  updated: `Novembre 2026`,
  sections: [
    { title: `Scrivici`, body: `Una domanda, un problema, un suggerimento: ${BRAND.supportEmail}. Puoi anche usare «Dai il tuo parere» in Profilo › Impostazioni.` },
    { title: `Emergenza`, body: `Il team non può rispondere alle emergenze. In Francia chiama il 15 (SAMU) o il 112; in caso di sofferenza o pensieri suicidi, il 3114, gratuito, 24 ore su 24.` },
    { title: `Abbonamento`, body: `Sottoscrizione, disdetta e rimborsi si gestiscono nelle impostazioni del tuo account Apple o Google. Dopo un cambio di telefono: Profilo › Il mio abbonamento › Ripristina gli acquisti.` },
    { title: `I tuoi dati`, body: `Consultazione, esportazione ed eliminazione: Profilo › Privacy. Per esercitare i tuoi diritti via e-mail: ${BRAND.supportEmail}.` },
  ],
};

export const LEGAL_NOTICE: LegalDoc = localized(NOTICE_FR, NOTICE_EN, { es: NOTICE_ES, de: NOTICE_DE, it: NOTICE_IT });
export const ACCOUNT_DELETION: LegalDoc = localized(DELETION_FR, DELETION_EN, { es: DELETION_ES, de: DELETION_DE, it: DELETION_IT });
export const SUPPORT: LegalDoc = localized(SUPPORT_FR, SUPPORT_EN, { es: SUPPORT_ES, de: SUPPORT_DE, it: SUPPORT_IT });

// Textes fixes recalculés à chaque changement de langue (les écrans lisent toujours la valeur à jour)
onLocaleChange(() => {
  LEGAL_DRAFT_NOTICE = DRAFT_NOTICE();
});
