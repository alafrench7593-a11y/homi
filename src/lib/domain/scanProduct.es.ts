/** Textes espagnols du moteur « produit » (mêmes clés que la version française de scanProduct.ts). */
import type { Exposure, ProductType, Zone } from './scanProduct';

export const PRODUCT_TYPE_LABEL_ES: Record<ProductType, string> = {
  cream: 'Crema', oil: 'Aceite de cuidado', wash_gel: 'Gel limpiador', shampoo: 'Champú', sunscreen: 'Protección solar', makeup: 'Maquillaje',
  stretch_marks: 'Cuidado antiestrías', wipes: 'Toallitas', diapers: 'Pañales', laundry: 'Detergente para ropa', household: 'Producto de limpieza', perfume: 'Perfume',
  baby_care: 'Cuidado bebé / niño', medicine: 'Medicamento', essential_oil: 'Aceite esencial', supplement: 'Complemento alimenticio',
  treatment: 'Producto de tratamiento (piojos, verrugas…)', other: 'Otro',
};

export const EXPOSURE_LABEL_ES: Record<Exposure, string> = {
  rinse_off: 'Producto con aclarado', leave_on: 'Producto sin aclarado (permanece en la piel)', inhaled: 'Posible exposición por inhalación',
  indirect: 'Contacto indirecto (textiles, superficies)', unknown: 'Tipo de exposición desconocido',
};

export const EXPOSURE_EXPLANATION_ES: Record<Exposure, string> = {
  rinse_off: 'El producto se aclara después de aplicarlo: permanece poco tiempo en contacto con la piel.',
  leave_on: 'El producto permanece en la piel: la exposición es más larga que con un producto que se aclara.',
  inhaled: 'Una parte del producto puede respirarse (espray, perfume, difusión): ventila la habitación y evita usarlo cerca de la cara de un niño.',
  indirect: 'El contacto se produce sobre todo a través de los textiles lavados o de las superficies; el riesgo principal viene del producto puro (ingestión accidental, salpicaduras).',
  unknown: 'La aplicación no sabe si este producto se aclara, se deja en la piel o se inhala: indícalo para afinar el análisis.',
};

export const ZONE_LABEL_ES: Record<Zone, string> = {
  face: 'Cara', body: 'Cuerpo', diaper_area: 'Zona del pañal', scalp: 'Cuero cabelludo', lips: 'Labios', hands: 'Manos',
  air: 'Aire ambiente', textiles: 'Textiles', surfaces: 'Superficies', unknown: 'Zona no indicada',
};
