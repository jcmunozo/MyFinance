import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiGet, apiPost, apiPut, apiDelete, fromApiBill, toApiBill, fromApiPension, toApiPension } from '../lib/api';
import { uid } from '../lib/format';
import { todayYm } from '../lib/dates';

export const useFinanceStore = defineStore('finance', () => {
  const assets = ref([]);
  const moves = ref([]);
  const items = ref([]);
  const invoices = ref([]);
  const bills = ref([]);
  const debts = ref([]);
  const goals = ref([]);
  const insurances = ref([]);
  const checkups = ref([]);
  const affiliations = ref([]);
  const cesantias = ref([]);
  const pensionPeriods = ref([]);
  const budgets = ref({});
  const pension = ref({ fondo: 'RPM', administradora: '', semanasCotizadas: '', fechaCorte: '', metaSemanas: 1300 });
  const trm = ref('');
  const taxDeclaration = ref({ fecha: '' });
  const creditScore = ref({ score: '', max: 950, fecha: '' });
  const loaded = ref(false);
  const loadError = ref(false);

  async function loadAll() {
    try {
      const [assetsRes, movesRes, itemsRes, invoicesRes, billsRes, pensionRes, pensionPeriodsRes, affiliationsRes, cesantiasRes,
        debtsRes, goalsRes, insurancesRes, checkupsRes, budgetRows, trmRow, taxRow, scoreRow] = await Promise.all([
        apiGet('assets'), apiGet('moves'), apiGet('items'), apiGet('invoices'), apiGet('bills'),
        apiGet('pension'), apiGet('pension-periods'), apiGet('affiliations'), apiGet('cesantias'),
        apiGet('debts'), apiGet('goals'), apiGet('insurances'), apiGet('checkups'), apiGet('budgets'),
        apiGet('settings/trm'), apiGet('settings/tax_declaration_fecha'), apiGet('settings/credit_score'),
      ]);

      assets.value = assetsRes;
      moves.value = movesRes;
      items.value = itemsRes;
      invoices.value = invoicesRes;
      bills.value = billsRes.map(fromApiBill);
      pension.value = fromApiPension(pensionRes);
      pensionPeriods.value = pensionPeriodsRes;
      affiliations.value = affiliationsRes;
      cesantias.value = cesantiasRes;
      debts.value = debtsRes;
      goals.value = goalsRes;
      insurances.value = insurancesRes;
      checkups.value = checkupsRes;
      budgets.value = {};
      budgetRows.forEach((b) => { budgets.value[b.categoria] = Number(b.limite); });
      trm.value = trmRow && trmRow.value ? trmRow.value : '';
      taxDeclaration.value = { fecha: taxRow && taxRow.value ? taxRow.value : '' };
      creditScore.value = scoreRow && scoreRow.value ? JSON.parse(scoreRow.value) : { score: '', max: 950, fecha: '' };
      loadError.value = false;
    } catch (e) {
      console.error('No se pudo cargar la información desde el servidor', e);
      loadError.value = true;
    }
    loaded.value = true;
  }

  // ----- Activos -----
  async function addAsset(asset) {
    const saved = await apiPost('assets', { id: uid(), ...asset });
    assets.value.push(saved);
  }
  async function removeAsset(id) {
    await apiDelete(`assets/${id}`);
    assets.value = assets.value.filter((a) => a.id !== id);
  }

  // ----- Movimientos -----
  async function addMove(move) {
    const saved = await apiPost('moves', { id: uid(), ...move });
    moves.value.push(saved);
  }
  async function removeMove(id) {
    await apiDelete(`moves/${id}`);
    moves.value = moves.value.filter((m) => m.id !== id);
  }

  // ----- Presupuestos (PK = categoria) -----
  async function setBudget(categoria, limite) {
    await apiPost('budgets', { categoria, limite });
    budgets.value[categoria] = limite;
  }
  async function removeBudget(categoria) {
    await apiDelete(`budgets/${encodeURIComponent(categoria)}`);
    delete budgets.value[categoria];
  }

  // ----- Catálogo de productos -----
  // Nunca se actualiza un item existente: un precio nuevo siempre crea una
  // fila nueva, para conservar el histórico de precios por producto.
  async function addItem(item) {
    const saved = await apiPost('items', { id: uid(), ...item });
    items.value.push(saved);
    return saved;
  }

  // Parcha localmente la deuda que una factura (al crearse o borrarse) haya
  // afectado, sin necesidad de recargar todo `debts`.
  function patchDebt(debt) {
    if (!debt) return;
    const idx = debts.value.findIndex((d) => d.id === debt.id);
    if (idx !== -1) debts.value[idx] = debt;
  }

  // ----- Facturas (compuestas de productos del catálogo) -----
  async function addInvoice(invoice) {
    const saved = await apiPost('invoices', { id: uid(), ...invoice });
    invoices.value.push(saved);
    patchDebt(saved.debt);
  }
  async function removeInvoice(id) {
    const result = await apiDelete(`invoices/${id}`);
    invoices.value = invoices.value.filter((i) => i.id !== id);
    patchDebt(result && result.debt);
  }

  // ----- Tarjetas / servicios -----
  async function addBill(bill) {
    const saved = await apiPost('bills', toApiBill({ id: uid(), ...bill }));
    bills.value.push(fromApiBill(saved));
  }
  async function payBill(id) {
    const bill = bills.value.find((b) => b.id === id);
    if (!bill) return;
    const updated = { ...bill, lastPaidYm: todayYm() };
    await apiPut(`bills/${id}`, toApiBill(updated));
    bill.lastPaidYm = updated.lastPaidYm;
  }
  async function removeBill(id) {
    await apiDelete(`bills/${id}`);
    bills.value = bills.value.filter((b) => b.id !== id);
  }

  // ----- Deudas -----
  async function addDebt(debt) {
    const saved = await apiPost('debts', { id: uid(), ...debt });
    debts.value.push(saved);
  }
  async function removeDebt(id) {
    await apiDelete(`debts/${id}`);
    debts.value = debts.value.filter((d) => d.id !== id);
  }

  // ----- Declaración de renta -----
  async function saveTaxDeclaration(fecha) {
    await apiPut('settings/tax_declaration_fecha', { value: fecha || null });
    taxDeclaration.value = { fecha };
  }

  // ----- Pensión -----
  async function savePension(newPension) {
    await apiPut('pension', toApiPension(newPension));
    pension.value = newPension;
  }
  async function addPensionPeriod(period) {
    const saved = await apiPost('pension-periods', { id: uid(), ...period });
    pensionPeriods.value.push(saved);
  }
  async function removePensionPeriod(id) {
    await apiDelete(`pension-periods/${id}`);
    pensionPeriods.value = pensionPeriods.value.filter((p) => p.id !== id);
  }

  // ----- Cesantías -----
  async function addCesantia(cesantia) {
    const saved = await apiPost('cesantias', { id: uid(), ...cesantia });
    cesantias.value.push(saved);
  }
  async function removeCesantia(id) {
    await apiDelete(`cesantias/${id}`);
    cesantias.value = cesantias.value.filter((c) => c.id !== id);
  }

  // ----- Afiliaciones -----
  async function addAffiliation(aff) {
    const saved = await apiPost('affiliations', { id: uid(), ...aff });
    affiliations.value.push(saved);
  }
  async function removeAffiliation(id) {
    await apiDelete(`affiliations/${id}`);
    affiliations.value = affiliations.value.filter((a) => a.id !== id);
  }

  // ----- Chequeos -----
  async function addCheckup(checkup) {
    const saved = await apiPost('checkups', { id: uid(), ...checkup });
    checkups.value.push(saved);
  }
  async function removeCheckup(id) {
    await apiDelete(`checkups/${id}`);
    checkups.value = checkups.value.filter((c) => c.id !== id);
  }

  // ----- Metas -----
  async function addGoal(goal) {
    const saved = await apiPost('goals', { id: uid(), ...goal });
    goals.value.push(saved);
  }
  async function removeGoal(id) {
    await apiDelete(`goals/${id}`);
    goals.value = goals.value.filter((g) => g.id !== id);
  }

  // ----- Seguros -----
  async function addInsurance(insurance) {
    const saved = await apiPost('insurances', { id: uid(), ...insurance });
    insurances.value.push(saved);
  }
  async function removeInsurance(id) {
    await apiDelete(`insurances/${id}`);
    insurances.value = insurances.value.filter((i) => i.id !== id);
  }

  // ----- TRM / puntaje crediticio -----
  async function saveTrm(value) {
    await apiPut('settings/trm', { value });
    trm.value = value;
  }
  async function saveCreditScore(score) {
    await apiPut('settings/credit_score', { value: JSON.stringify(score) });
    creditScore.value = score;
  }

  return {
    assets, moves, items, invoices, bills, debts, goals, insurances, checkups, affiliations, cesantias,
    pensionPeriods, budgets, pension, trm, taxDeclaration, creditScore, loaded, loadError,
    loadAll,
    addAsset, removeAsset,
    addMove, removeMove,
    setBudget, removeBudget,
    addItem,
    addInvoice, removeInvoice,
    addBill, payBill, removeBill,
    addDebt, removeDebt,
    saveTaxDeclaration,
    savePension, addPensionPeriod, removePensionPeriod,
    addCesantia, removeCesantia,
    addAffiliation, removeAffiliation,
    addCheckup, removeCheckup,
    addGoal, removeGoal,
    addInsurance, removeInsurance,
    saveTrm, saveCreditScore,
  };
});
