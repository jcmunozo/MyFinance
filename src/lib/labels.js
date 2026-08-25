export const TABS = [
  { id: 'resumen', label: 'Resumen', icon: 'home', subtitle: 'Tu patrimonio, alertas y gasto del mes de un vistazo' },
  { id: 'activos', label: 'Activos', icon: 'wallet', subtitle: 'Cuentas de ahorro, CDT, inversiones y puntos' },
  { id: 'movimientos', label: 'Movimientos', icon: 'swap', subtitle: 'Ingresos, gastos y presupuesto por categoría' },
  { id: 'facturas', label: 'Compras', icon: 'receipt', subtitle: 'Agrega facturas y productos, y compara precios entre tiendas' },
  { id: 'pagos', label: 'Pagos y deudas', icon: 'card', subtitle: 'Tarjetas, servicios recurrentes, deudas y vencimientos' },
  { id: 'pension', label: 'Protección social', icon: 'shield', subtitle: 'Pensión, cesantías, salud y chequeos preventivos' },
  { id: 'metas', label: 'Metas y seguros', icon: 'target', subtitle: 'Fondo de emergencia, metas de ahorro y pólizas' },
];

export const BILL_LABELS = {
  tarjeta: 'Tarjeta de crédito', energia: 'Energía', agua: 'Agua', gas: 'Gas',
  internet_movil: 'Internet móvil', internet_hogar: 'Internet / TV hogar', otro: 'Otro',
};

export const AFF_LABELS = {
  eps: 'EPS', arl: 'ARL', caja: 'Caja de compensación', pension_vol: 'Pensión voluntaria',
};

export const DEBT_LABELS = {
  tarjeta: 'Tarjeta de crédito', libre_inversion: 'Crédito libre inversión', libranza: 'Libranza',
  hipoteca: 'Crédito hipotecario', vehiculo: 'Crédito de vehículo', otro: 'Otro',
};

export const INS_LABELS = {
  vida: 'Vida', exequial: 'Exequial', hogar: 'Hogar', auto: 'Auto',
  salud_prepagada: 'Salud prepagada / complementaria', otro: 'Otro',
};

export const CHECKUP_LABELS = {
  general: 'Examen médico general', visual: 'Examen visual', odontologia: 'Odontología', otro: 'Otro',
};

export const ASSET_TIPO_LABELS = { cuenta: 'Cuenta', cdt: 'CDT', inversion: 'Inversión', puntos: 'Puntos' };
