// Catálogos y constantes para el formulario de cliente ocasional

// Códigos de tipo de documento (Tango) - Auto-detectados según longitud
// Ya no hay selector visible, se detecta automáticamente
export const TIPO_DOC_CODES = {
  CUIT: 80,  // 11 dígitos (formato: XX-XXXXXXXX-X)
  DNI: 96,   // 7-8 dígitos
  SIN_IDENTIFICAR: 99,
};

// DNI por defecto cuando el usuario no proporciona documento
// Se usa este valor para Tango ya que el campo no puede estar vacío
export const DNI_GENERICO_DEFAULT = "00000000";

// Lista de DNIs considerados "genéricos" que no disparan búsqueda de cliente existente
export const DNIS_GENERICOS = [
  "00000000",
  "0000000",
  "11111111",
  "1111111",
  "99999999",
  "9999999",
  "12345678",
];

// Categorías IVA (tal como aparece en Tango)
export const CATEGORIAS_IVA = [
  { value: "CF", label: "Consumidor Final" },
  { value: "EX", label: "Exento" },
  { value: "MT", label: "Monotributo" },
  { value: "MT Social", label: "Monotributo Social" },
  { value: "NR", label: "No Responsable" },
  { value: "RI", label: "Resp. Inscripto" },
  { value: "RN", label: "Resp. No Inscripto" },
];

// Descripciones de Categorías IVA (ayuda contextual para el usuario)
export const DESCRIPCION_CATEGORIAS_IVA = {
  "CF": "No pueden descontar IVA de sus compras. Se les aplican percepciones de IVA.",
  "EX": "No pagan IVA. Requiere constancia de exención emitida por AFIP.",
  "MT": "Régimen simplificado para pequeños contribuyentes. Se les aplican percepciones de IVA.",
  "MT Social": "Monotributo Social para emprendedores de bajos ingresos.",
  "NR": "No están obligados a facturar IVA.",
  "RI": "Pueden descontar IVA de sus compras. No se les aplican percepciones de IVA.",
  "RN": "Responsable no inscripto. No pueden descontar IVA."
};

// Identificaciones Tributarias
export const IDENTIFICACIONES_TRIBUTARIAS = [
  { value: "CUIT", label: "C.U.I.T." },
  { value: "CUIL", label: "C.U.I.L." },
  { value: "CDI", label: "C.D.I." },
  { value: "LE", label: "Libreta de enrolamiento" },
  { value: "LC", label: "Libreta cívica" },
  { value: "DNI", label: "D.N.I." },
  { value: "Pasaporte", label: "Pasaporte" },
  { value: "CI Policía", label: "C.I. Policía Federal" },
  { value: "Otro", label: "Otro tipo de documento" },
];

// Países
export const PAISES = [
  { value: "AR", label: "Argentina" },
  { value: "BR", label: "Brasil" },
  { value: "CL", label: "Chile" },
  { value: "UY", label: "Uruguay" },
  { value: "PY", label: "Paraguay" },
  { value: "BO", label: "Bolivia" },
  { value: "PE", label: "Perú" },
  { value: "CO", label: "Colombia" },
  { value: "EC", label: "Ecuador" },
  { value: "VE", label: "Venezuela" },
  { value: "MX", label: "México" },
  { value: "US", label: "Estados Unidos" },
  { value: "ES", label: "España" },
  { value: "OT", label: "Otro" },
];

// Valores por defecto del formulario
export const FORM_DEFAULTS = {
  razonSocial: "",
  nombreContacto: "",
  dniCuit: "",
  tipoDoc: 99, // Se auto-detectará según lo ingresado
  domicilio: "",
  localidad: "",
  codigoPostal: "",
  codProvincia: "",
  nombreProvincia: "",
  codPais: "AR", // Argentina por defecto
  identifTributaria: "CUIT", // CUIT por defecto
  nroIngresosBrutos: "",
  categoriaIva: "CF", // Consumidor Final por defecto
  rg1817: "",
  rg1817Vto: "",
  rg1817NroCertif: "",
  sobreTasa: "N",
  porcExclusion: "0.00",
  liquidaImpInterno: "N",
  discriminaImpInt: "N",
  sobreTasaImpInt: "N",
  email: "",
  telefono: "",
  fax: "",
  paginaWeb: "",
  actividad: "",
  rubroCom: "",
  direccionEntrega: "",
  provinciaEntrega: "",
  localidadEntrega: "",
  codigoPostalEntrega: "",
  telefonoEntrega: "",
  faxEntrega: "",
  observaciones: "",
};
