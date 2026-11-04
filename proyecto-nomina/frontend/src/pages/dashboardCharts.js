// Configuracion de las graficas del Dashboard (Chart.js).
// Va separada del componente para mantener Dashboard.jsx corto y para poder
// probar/renderizar cada configuracion por si sola.

export const PALETA = ["#1f3a5f", "#2563eb", "#c76b2e", "#2e7d4f", "#7c8db5", "#b58500"];
export const COLOR = { ingresos: "#2563eb", egresos: "#c76b2e", neto: "#2e7d4f" };

export const fmtQ = (n, dec = 2) =>
  "Q " + Number(n || 0).toLocaleString("es-GT", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtEje = (v) => "Q " + Number(v).toLocaleString("es-GT");
const etiquetaMes = (e) => `${e.nombreMes.slice(0, 3)} ${String(e.anio).slice(2)}`; // "Sep 26"

const base = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom", labels: { boxWidth: 12, padding: 14 } } },
};

// Barras agrupadas: ingresos, egresos y neto de los ultimos 6 meses.
export function evolucionChart(evolucion) {
  const serie = (label, key, color) => ({ label, data: evolucion.map((e) => e[key]), backgroundColor: color, borderRadius: 4 });
  return {
    data: {
      labels: evolucion.map(etiquetaMes),
      datasets: [
        serie("Ingresos", "ingresos", COLOR.ingresos),
        serie("Egresos", "egresos", COLOR.egresos),
        serie("Neto", "neto", COLOR.neto),
      ],
    },
    options: {
      ...base,
      plugins: { ...base.plugins, tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${fmtQ(c.parsed.y)}` } } },
      scales: { y: { beginAtZero: true, ticks: { callback: fmtEje } } },
    },
  };
}

// Dona: cuanto representa cada departamento del total devengado del periodo.
export function costoPorDeptoChart(porDepartamento) {
  return {
    data: {
      labels: porDepartamento.map((d) => d.departamento),
      datasets: [{
        data: porDepartamento.map((d) => d.ingresos),
        backgroundColor: PALETA, borderColor: "#fff", borderWidth: 2,
      }],
    },
    options: {
      ...base,
      cutout: "58%",
      plugins: {
        ...base.plugins,
        tooltip: {
          callbacks: {
            label: (c) => {
              const total = c.dataset.data.reduce((a, b) => a + b, 0);
              return ` ${c.label}: ${fmtQ(c.parsed)} (${((c.parsed / total) * 100).toFixed(1)}%)`;
            },
          },
        },
      },
    },
  };
}

// Barras horizontales: a donde se va el dinero descontado.
export function descuentosChart(descuentos) {
  return {
    data: {
      labels: descuentos.map((d) => d.tipo),
      datasets: [{ label: "Monto descontado", data: descuentos.map((d) => d.total), backgroundColor: PALETA, borderRadius: 4 }],
    },
    options: {
      ...base,
      indexAxis: "y",
      plugins: { ...base.plugins, legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${fmtQ(c.parsed.x)}` } } },
      scales: { x: { beginAtZero: true, ticks: { callback: fmtEje } } },
    },
  };
}

// Barras: salario base promedio por departamento (el tooltip indica cuantos empleados hay).
export function salarioPromedioChart(plantilla) {
  return {
    data: {
      labels: plantilla.map((p) => p.departamento),
      datasets: [{ label: "Salario base promedio", data: plantilla.map((p) => p.salarioPromedio), backgroundColor: "#1f3a5f", borderRadius: 4 }],
    },
    options: {
      ...base,
      plugins: {
        ...base.plugins,
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => ` ${fmtQ(c.parsed.y)}`,
            afterLabel: (c) => ` ${plantilla[c.dataIndex].empleados} empleado(s) activo(s)`,
          },
        },
      },
      scales: { y: { beginAtZero: true, ticks: { callback: fmtEje } } },
    },
  };
}
