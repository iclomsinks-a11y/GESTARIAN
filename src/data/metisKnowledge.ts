export interface MetisFAQ {
  id: string;
  categoria: 'presupuestos' | 'clientes' | 'vehiculos' | 'facturacion' | 'general';
  keywords: string[];
  pregunta: string;
  respuesta: string;
}

export const METIS_PRESUPUESTOS_KNOWLEDGE = `
MÓDULO OFICIAL: CREACIÓN DE PRESUPUESTOS EN GESTARIAN

1. PROTOCOLO DE INICIO ("NUEVO PRESUPUESTO"):
   - Si el usuario dice "nuevo presupuesto" o cualquier sinónimo de nuevo/crear:
   - RESPUESTA EXACTA: "De acuerdo, vamos con ello, dame datos. ¿Es para un nuevo cliente o para un cliente de nuestra base de datos?"

2. ASIGNACIÓN DEL VEHÍCULO DEL CLIENTE:
   - Al seleccionar o identificar al cliente en la base de datos:
     A) Si el cliente tiene UN SOLO vehículo:
        RESPUESTA EXACTA: "[Nombre del cliente] tiene un solo vehículo en la base de datos, lo añado. Si quieres que añada otro vehículo me lo dices y lo hago."
     
     B) Si el cliente tiene VARIOS vehículos (de 2 a 5 vehículos):
        RESPUESTA EXACTA: "¿Para qué vehículo va a ser este presupuesto? El cliente tiene [número] vehículos: [describe solo marca y modelo de cada uno, sin decir la matrícula]."
     
     C) Si el cliente tiene MUCHOS vehículos (más de 5 vehículos, flota):
        RESPUESTA EXACTA: "El cliente tiene flota de vehículos, por favor selecciona el vehículo directamente en el presupuesto cuando terminemos."

3. SOLICITUD DE TRABAJOS Y CONCEPTOS:
   - Una vez fijados el cliente y el vehículo, METIS debe preguntar textualmente:
     "¿Cuál es el trabajo que le vas a hacer a este vehículo?"

4. TRADUCCIÓN INTELIGENTE DE LENGUAJE COLOQUIAL A CONCEPTOS FORMALES:
   - El usuario puede hablar con giros coloquiales o jerga de taller.
   - METIS desglosa internamente en conceptos formales (ej. pintado de paragolpes delantero, etc.).

5. SOLICITUD DE PRECIOS Y DATOS FALTANTES:
   - METIS pregunta por precios unitarios de cada concepto hasta que el presupuesto esté listo.

6. CÁLCULO DE TOTALES E IMPUESTOS:
   - Base Imponible + 21% IVA = Total Presupuesto.

7. ENVÍO DEL PRESUPUESTO POR WHATSAPP:
   - Pregunta si desea enviarlo por WhatsApp al cliente y confirma la acción.
`;

export const METIS_FAQ_LIST: MetisFAQ[] = [
  {
    id: 'p_nuevo',
    categoria: 'presupuestos',
    keywords: [
      'nuevo presupuesto', 'crear presupuesto', 'hacer presupuesto', 
      'cumplimentar presupuesto', 'desarrollar presupuesto', 'implementar presupuesto', 
      'rellenar presupuesto', 'generar presupuesto', 'empezar presupuesto', 
      'preparar presupuesto', 'redactar presupuesto', 'abrir presupuesto'
    ],
    pregunta: '¿Cómo inicio un nuevo presupuesto?',
    respuesta: 'De acuerdo, vamos con ello, dame datos. ¿Es para un nuevo cliente o para un cliente de nuestra base de datos?'
  },
  {
    id: 'p_vehiculo_unico',
    categoria: 'presupuestos',
    keywords: ['vehiculo cliente', 'coche cliente', 'un solo coche'],
    pregunta: '¿Cómo se asigna el vehículo cuando el cliente tiene uno solo?',
    respuesta: 'El cliente tiene un solo vehículo en la base de datos, lo añado. Si quieres que añada otro vehículo me lo dices y lo hago.'
  },
  {
    id: 'p_varios_vehiculos',
    categoria: 'presupuestos',
    keywords: ['varios vehiculos', 'varios coches', 'dos vehiculos', 'tres vehiculos'],
    pregunta: '¿Cómo actúa METIS cuando el cliente tiene de 2 a 5 vehículos?',
    respuesta: '¿Para qué vehículo va a ser este presupuesto? El cliente tiene varios vehículos: describe la marca y el modelo de cada uno sin decir la matrícula.'
  },
  {
    id: 'p_flota_vehiculos',
    categoria: 'presupuestos',
    keywords: ['flota vehiculos', 'muchos coches', 'mas de cinco vehiculos'],
    pregunta: '¿Cómo actúa METIS cuando el cliente tiene más de 5 vehículos o una flota?',
    respuesta: 'El cliente tiene flota de vehículos, por favor selecciona el vehículo directamente en el presupuesto cuando terminemos.'
  },
  {
    id: 'p_pregunta_trabajos',
    categoria: 'presupuestos',
    keywords: ['que trabajos', 'pedir conceptos', 'que trabajo le vas a hacer'],
    pregunta: '¿Cómo se solicitan los trabajos a realizar?',
    respuesta: '¿Cuál es el trabajo que le vas a hacer a este vehículo?'
  },
  {
    id: 'p_datos_cliente',
    categoria: 'presupuestos',
    keywords: ['datos cliente', 'que datos necesito del cliente', 'campos obligatorios cliente'],
    pregunta: '¿Qué datos del cliente son obligatorios para el presupuesto?',
    respuesta: 'Son obligatorios el nombre completo, el CIF o NIF y la dirección. El teléfono y el correo electrónico son opcionales pero recomendables.'
  },
  {
    id: 'p_datos_vehiculo',
    categoria: 'presupuestos',
    keywords: ['datos vehiculo', 'matricula obligatoria', 'coche presupuesto'],
    pregunta: '¿Qué datos del vehículo se deben incluir?',
    respuesta: 'Es fundamental incluir la matrícula, la marca y el modelo del vehículo para identificar correctamente la reparación en el taller.'
  },
  {
    id: 'p_calculos',
    categoria: 'presupuestos',
    keywords: ['como se calcula', 'calcular total', 'iva presupuesto', 'base imponible'],
    pregunta: '¿Cómo se calculan los importes y el total del presupuesto?',
    respuesta: 'Cada línea multiplica la cantidad de unidades por su precio. La suma de todas las líneas nos da la base imponible, y añadiendo el 21% de IVA obtenemos el total final.'
  },
  {
    id: 'p_whatsapp_envio',
    categoria: 'presupuestos',
    keywords: ['enviar por whatsapp', 'mandar presupuesto whatsapp', 'ofrecer envio'],
    pregunta: '¿Qué hago cuando termino de redactar el presupuesto?',
    respuesta: 'Te pregunto si quieres que se lo envíe por WhatsApp al cliente. Si me dices que sí, preparo los datos bien estructurados como texto y confirmo el envío con éxito.'
  }
];

let metisLocalState = 0;

export function resetMetisState(): void {
  metisLocalState = 0;
}

export function findDirectFaqAnswer(query: string): string | null {
  const normalized = query.toLowerCase().trim();

  // Si el usuario pide cancelar o detener el flujo guiado
  if (['cancelar', 'para', 'detener', 'olvídalo', 'olvidalo', 'salir', 'menu', 'inicio'].some(w => normalized === w || normalized.startsWith(w + ' '))) {
    metisLocalState = 0;
    return 'Entendido, cancelo el proceso. ¿En qué más puedo ayudarte en el taller?';
  }

  // Comprobar primero FAQs directas explícitas para no atraparlas en el estado de presupuesto
  for (const faq of METIS_FAQ_LIST) {
    if (faq.id !== 'p_nuevo' && faq.keywords.some(kw => normalized.includes(kw.toLowerCase()))) {
      metisLocalState = 0;
      return faq.respuesta;
    }
  }

  const isNuevoPresupuesto = METIS_FAQ_LIST.find(f => f.id === 'p_nuevo')?.keywords.some(kw => normalized.includes(kw.toLowerCase()));
  
  if (isNuevoPresupuesto) {
    metisLocalState = 1;
    return 'De acuerdo, vamos con ello, dame datos. ¿Es para un nuevo cliente o para un cliente de nuestra base de datos?';
  }

  if (metisLocalState === 1) {
    // Si la respuesta parece responder al cliente/vehículo
    metisLocalState = 2;
    if (normalized.includes('flota') || normalized.includes('muchos')) {
      return 'El cliente tiene flota de vehículos, por favor selecciona el vehículo directamente en el presupuesto cuando terminemos. ¿Cuál es el trabajo que le vas a hacer?';
    } else if (normalized.includes('varios') || normalized.includes('dos') || normalized.includes('tres')) {
      return '¿Para qué vehículo va a ser este presupuesto? El cliente tiene varios vehículos en su ficha. Dímelo y seguimos.';
    } else {
      return 'Ese cliente tiene un solo vehículo en la base de datos, lo añado. Si quieres que añada otro vehículo me lo dices y lo hago. ¿Cuál es el trabajo que le vas a hacer a este vehículo?';
    }
  }

  if (metisLocalState === 2) {
    metisLocalState = 3;
    return 'He añadido esos conceptos de trabajo al presupuesto. ¿Qué precio le ponemos a cada concepto?';
  }

  if (metisLocalState === 3) {
    metisLocalState = 4;
    return 'Perfecto, he actualizado los precios y calculado la base imponible y el IVA. El presupuesto está listo. ¿Quieres que lo envíe por WhatsApp al cliente?';
  }

  if (metisLocalState === 4) {
    metisLocalState = 0;
    const afirmaciones = ['si', 'sí', 'claro', 'envia', 'ok', 'vale', 'por supuesto', 'mándalo', 'adelante'];
    const acepta = afirmaciones.some(a => normalized.includes(a));
    if (acepta) {
      return 'Perfecto, presupuesto enviado por WhatsApp al cliente con éxito.';
    } else {
      return 'De acuerdo, he guardado el presupuesto en el sistema sin enviarlo.';
    }
  }

  return null;
}

export function getMetisCustomInstructions(): string {
  const faqText = METIS_FAQ_LIST
    .map(faq => `P: ${faq.pregunta}\nR: ${faq.respuesta}`)
    .join('\n\n');

  return `
${METIS_PRESUPUESTOS_KNOWLEDGE}

RESPUESTAS OFICIALES PRIORITARIAS:
${faqText}
`;
}
