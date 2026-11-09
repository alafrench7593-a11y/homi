/** Textes allemands du moteur « produit » (mêmes clés que la version française de scanProduct.ts). */
import type { Exposure, ProductType, Zone } from './scanProduct';

export const PRODUCT_TYPE_LABEL_DE: Record<ProductType, string> = {
  cream: 'Creme', oil: 'Pflegeöl', wash_gel: 'Waschgel', shampoo: 'Shampoo', sunscreen: 'Sonnenschutz', makeup: 'Make-up',
  stretch_marks: 'Pflege gegen Dehnungsstreifen', wipes: 'Feuchttücher', diapers: 'Windeln', laundry: 'Waschmittel', household: 'Haushaltsreiniger', perfume: 'Parfüm',
  baby_care: 'Baby- / Kinderpflege', medicine: 'Arzneimittel', essential_oil: 'Ätherisches Öl', supplement: 'Nahrungsergänzungsmittel',
  treatment: 'Behandlungsmittel (Läuse, Warzen…)', other: 'Sonstiges',
};

export const EXPOSURE_LABEL_DE: Record<Exposure, string> = {
  rinse_off: 'Abwaschbares Produkt', leave_on: 'Nicht abgewaschenes Produkt (bleibt auf der Haut)', inhaled: 'Aufnahme über die Atemluft möglich',
  indirect: 'Indirekter Kontakt (Textilien, Oberflächen)', unknown: 'Art der Exposition unbekannt',
};

export const EXPOSURE_EXPLANATION_DE: Record<Exposure, string> = {
  rinse_off: 'Das Produkt wird nach dem Auftragen abgespült: Es bleibt nur kurz mit der Haut in Kontakt.',
  leave_on: 'Das Produkt bleibt auf der Haut: Die Exposition ist länger als bei einem abwaschbaren Produkt.',
  inhaled: 'Ein Teil des Produkts kann eingeatmet werden (Spray, Parfüm, Verdunstung): Lüfte gut und verwende es nicht in der Nähe des Gesichts eines Kindes.',
  indirect: 'Der Kontakt erfolgt vor allem über gewaschene Textilien oder Oberflächen; das Hauptrisiko geht vom unverdünnten Produkt aus (versehentliches Verschlucken, Spritzer).',
  unknown: 'Die App weiß nicht, ob dieses Produkt abgespült wird, auf der Haut bleibt oder eingeatmet wird: Gib es an, um die Analyse zu verfeinern.',
};

export const ZONE_LABEL_DE: Record<Zone, string> = {
  face: 'Gesicht', body: 'Körper', diaper_area: 'Windelbereich', scalp: 'Kopfhaut', lips: 'Lippen', hands: 'Hände',
  air: 'Raumluft', textiles: 'Textilien', surfaces: 'Oberflächen', unknown: 'Bereich nicht angegeben',
};
