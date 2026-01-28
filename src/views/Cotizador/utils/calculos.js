/**
 * Calcular percepciones sobre la venta
 * @param {Object} cliente - Datos del cliente con percepciones
 * @param {number} netoFinal - Neto gravado DESPUÉS de todos los descuentos (artículos + bonificación general)
 * @param {number} ivaFinal - IVA DESPUÉS de todos los descuentos (artículos + bonificación general)
 */
export const calcularPercepciones = (cliente, netoFinal, ivaFinal) => {
  if (!cliente || !cliente.percepciones || cliente.percepciones.length === 0) {
    return [];
  }

  const percepcionesCalculadas = [];

  cliente.percepciones.forEach(percepcion => {
    // Determinar base de cálculo según tabla BASE_CALCULO_PERCEPCION de Tango:
    // BASE_CALCULO viene mapeado desde el transformador:
    // - 'NETO_IVA' (ID 3): Se calcula sobre Neto gravado + I.V.A.
    // - 'NETO' (ID 1): Se calcula sobre Neto gravado solamente
    let baseCalculo;
    
    if (percepcion.BASE_CALCULO === 'NETO_IVA') {
      baseCalculo = netoFinal + ivaFinal;
    } else {
      baseCalculo = netoFinal;
    }

    // Validar mínimo no imponible
    if (baseCalculo < (percepcion.MIN_NO_IMPONIBLE || 0)) {
      return;
    }

    // Calcular importe - IMPORTANTE: soportar tanto ALICUOTA_ASIGNADA (ocasionales) como ALICUOTA (habituales)
    const alicuota = percepcion.ALICUOTA_ASIGNADA || percepcion.ALICUOTA || 0;
    const importeCalculado = (baseCalculo * alicuota) / 100;

    // Validar mínimo de percepción
    if (importeCalculado < (percepcion.MIN_PERCEPCION || 0)) {
      return;
    }

    percepcionesCalculadas.push({
      codigo: percepcion.COD_IMPUES,
      descripcion: percepcion.DESCRIPCION,
      tipo: percepcion.TIPO_IMPUESTO,
      tipoBase: percepcion.BASE_CALCULO, // 'NETO' o 'NETO_IVA'
      baseCalculo: baseCalculo,
      alicuota: alicuota,
      importe: Math.round(importeCalculado * 100) / 100,
    });
  });

  return percepcionesCalculadas;
};

/**
 * Calcular totales de la cotización incluyendo percepciones
 * ORDEN CORRECTO:
 * 1. Calcular subtotal neto (con descuentos de artículos)
 * 2. Calcular IVA (sobre precios con descuentos de artículos)
 * 3. Aplicar bonificación general
 * 4. Calcular percepciones sobre montos finales (neto y/o IVA después de bonificación general)
 */
export const calcularTotales = (cotizacion, articulos, cliente = null) => {
  if (cotizacion && articulos.length > 0) {
    const articulosActivos = articulos.filter(art => !art._isDeleted);

    let netoSinBonifGeneral = 0; // Neto después de descuentos de artículos, antes de bonif general
    let ivaSinBonifGeneral = 0; // IVA después de descuentos de artículos, antes de bonif general
    let totalBonificacionArticulos = 0;
    let totalBruto = 0; // Total antes de cualquier descuento

    // 1. Calcular totales por artículo (con descuentos de artículos)
    articulosActivos.forEach((item) => {
      const cantidad = Number(item.cantidad) || 0;
      const precioSinImp = Number(item.precioSinImp) || 0;
      const bonificacion = Number(item.bonif) || 0;
      const ivaPorcentaje = Number(item.iva) || 21;

      const precioConDescuento = precioSinImp * (1 - bonificacion / 100);
      const ivaItem = precioConDescuento * (ivaPorcentaje / 100) * cantidad;

      netoSinBonifGeneral += precioConDescuento * cantidad;
      totalBruto += precioSinImp * cantidad;
      ivaSinBonifGeneral += ivaItem;
      totalBonificacionArticulos += (precioSinImp * cantidad) * (bonificacion / 100);
    });

    const subtotalConIvaSinBonifGeneral = netoSinBonifGeneral + ivaSinBonifGeneral;

    // 2. Aplicar bonificación general (% sobre el subtotal con IVA)
    // IMPORTANTE: Usar ?? en lugar de || para que 0 sea un valor válido
    const bonificacionGeneralPct = Number(cotizacion.bonificacionGeneral ?? cotizacion.bonificacion ?? 0);
    const bonificacionGeneralMonto = (subtotalConIvaSinBonifGeneral * bonificacionGeneralPct) / 100;

    // 3. Calcular montos finales después de bonificación general
    // La bonificación general se distribuye proporcionalmente entre neto e IVA
    const factorBonifGeneral = 1 - (bonificacionGeneralPct / 100);
    const netoFinal = netoSinBonifGeneral * factorBonifGeneral;
    const ivaFinal = ivaSinBonifGeneral * factorBonifGeneral;
    const subtotalConIvaFinal = netoFinal + ivaFinal;

    // 4. Calcular percepciones sobre montos FINALES (después de todos los descuentos)
    const percepciones = calcularPercepciones(cliente, netoFinal, ivaFinal);
    const totalPercepciones = percepciones.reduce((sum, p) => sum + p.importe, 0);

    // 5. Total final = Subtotal (con IVA, después de bonif general) + Percepciones
    const totalFinal = subtotalConIvaFinal + totalPercepciones;

    return {
      subtotalSinIva: netoFinal, // Neto final después de todos los descuentos
      iva: ivaFinal, // IVA final después de todos los descuentos
      subtotalConIva: subtotalConIvaFinal, // Neto + IVA después de todos los descuentos
      bonificacion: totalBonificacionArticulos + bonificacionGeneralMonto, // Total de descuentos
      bonificacionArticulos: totalBonificacionArticulos,
      bonificacionGeneral: bonificacionGeneralMonto,
      bonificacionGeneralPct: bonificacionGeneralPct,
      percepciones: percepciones,
      totalPercepciones: totalPercepciones,
      total: totalFinal,
      totalBruto: totalBruto,
    };
  }

  if (cotizacion) {
    return {
      subtotalSinIva: (cotizacion.subtotal || 0) - (cotizacion.impuestos || 0),
      iva: cotizacion.impuestos || 0,
      subtotalConIva: cotizacion.subtotal || 0,
      bonificacion: cotizacion.bonificacionTotal || 0,
      percepciones: [],
      totalPercepciones: 0,
      total: cotizacion.total || 0,
      totalBruto: 0,
    };
  }

  return {
    subtotalSinIva: 0,
    iva: 0,
    subtotalConIva: 0,
    bonificacion: 0,
    percepciones: [],
    totalPercepciones: 0,
    total: 0,
    totalBruto: 0,
  };
};
