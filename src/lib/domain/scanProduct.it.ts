/** Textes italiens du moteur « produit » (mêmes clés que la version française de scanProduct.ts). */
import type { Exposure, ProductType, Zone } from './scanProduct';

export const PRODUCT_TYPE_LABEL_IT: Record<ProductType, string> = {
  cream: 'Crema', oil: 'Olio trattante', wash_gel: 'Gel detergente', shampoo: 'Shampoo', sunscreen: 'Protezione solare', makeup: 'Trucco',
  stretch_marks: 'Trattamento antismagliature', wipes: 'Salviette', diapers: 'Pannolini', laundry: 'Detersivo per bucato', household: 'Prodotto per la casa', perfume: 'Profumo',
  baby_care: 'Cura bebè / bambino', medicine: 'Medicinale', essential_oil: 'Olio essenziale', supplement: 'Integratore alimentare',
  treatment: 'Prodotto di trattamento (pidocchi, verruche…)', other: 'Altro',
};

export const EXPOSURE_LABEL_IT: Record<Exposure, string> = {
  rinse_off: 'Prodotto da risciacquare', leave_on: 'Prodotto senza risciacquo (resta sulla pelle)', inhaled: 'Possibile esposizione per inalazione',
  indirect: 'Contatto indiretto (tessuti, superfici)', unknown: 'Tipo di esposizione sconosciuto',
};

export const EXPOSURE_EXPLANATION_IT: Record<Exposure, string> = {
  rinse_off: 'Il prodotto viene risciacquato dopo l’applicazione: resta poco tempo a contatto con la pelle.',
  leave_on: 'Il prodotto resta sulla pelle: l’esposizione è più lunga rispetto a un prodotto da risciacquare.',
  inhaled: 'Una parte del prodotto può essere respirata (spray, profumo, diffusione): arieggia e evita di usarlo vicino al viso di un bambino.',
  indirect: 'Il contatto avviene soprattutto tramite i tessuti lavati o le superfici; il rischio principale viene dal prodotto puro (ingestione accidentale, schizzi).',
  unknown: 'L’app non sa se questo prodotto viene risciacquato, lasciato sulla pelle o inalato: indicalo per affinare l’analisi.',
};

export const ZONE_LABEL_IT: Record<Zone, string> = {
  face: 'Viso', body: 'Corpo', diaper_area: 'Zona del pannolino', scalp: 'Cuoio capelluto', lips: 'Labbra', hands: 'Mani',
  air: 'Aria ambiente', textiles: 'Tessuti', surfaces: 'Superfici', unknown: 'Zona non specificata',
};
