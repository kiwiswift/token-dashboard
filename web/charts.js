// charts.js — themed ECharts wrappers

const PALETTE = ['#4A9EFF', '#7C5CFF', '#3FB68B', '#E8A23B', '#E5484D', '#5BCEDA', '#F472B6'];

const BASE = {
  textStyle: { color: '#E6EDF3', fontFamily: 'Inter' },
  color: PALETTE,
  grid: { left: 36, right: 12, top: 24, bottom: 24, containLabel: true },
};

const X_AXIS = {
  axisLine:  { lineStyle: { color: '#1F2630' } },
  axisLabel: { color: '#8B98A6' },
  axisTick:  { show: false },
};

const Y_AXIS = {
  axisLine:  { show: false },
  axisTick:  { show: false },
  splitLine: { lineStyle: { color: '#1F2630' } },
  axisLabel: { color: '#8B98A6' },
};

const TOOLTIP = {
  trigger: 'axis',
  backgroundColor: '#0F1419',
  borderColor: '#283040',
  borderWidth: 1,
  textStyle: { color: '#E6EDF3', fontFamily: 'Inter', fontSize: 12 },
  padding: [8, 12],
};

function mount(el) {
  const c = echarts.init(el, null, { renderer: 'svg' });
  window.addEventListener('resize', () => c.resize());
  return c;
}

export function lineChart(el, { x, series }) {
  const c = mount(el);
  c.setOption({
    ...BASE,
    tooltip: TOOLTIP,
    legend: { textStyle: { color: '#8B98A6' }, top: 0, right: 0, icon: 'roundRect', itemWidth: 8, itemHeight: 8 },
    xAxis: { ...X_AXIS, type: 'category', data: x, boundaryGap: false },
    yAxis: { ...Y_AXIS, type: 'value' },
    series: series.map(s => ({
      ...s, type: 'line', smooth: true, showSymbol: false,
      areaStyle: { opacity: 0.12 }, lineStyle: { width: 2 },
    })),
  });
  return c;
}

export function barChart(el, { categories, values, color }) {
  const c = mount(el);
  c.setOption({
    ...BASE,
    tooltip: { ...TOOLTIP, axisPointer: { type: 'shadow' } },
    xAxis: { ...X_AXIS, type: 'category', data: categories, axisLabel: { ...X_AXIS.axisLabel, interval: 0, rotate: categories.length > 5 ? 25 : 0 } },
    yAxis: { ...Y_AXIS, type: 'value' },
    series: [{
      type: 'bar', data: values,
      itemStyle: { color: color || PALETTE[0], borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 32,
    }],
  });
  return c;
}

export function donutChart(el, data) {
  const c = mount(el);
  c.setOption({
    color: PALETTE,
    tooltip: { backgroundColor: '#0F1419', borderColor: '#283040', borderWidth: 1, textStyle: { color: '#E6EDF3', fontFamily: 'Inter' } },
    legend: { textStyle: { color: '#8B98A6' }, bottom: 0, icon: 'roundRect', itemWidth: 8, itemHeight: 8 },
    series: [{
      type: 'pie', radius: ['58%', '82%'], avoidLabelOverlap: true, padAngle: 2,
      itemStyle: { borderColor: '#0F1419', borderWidth: 2, borderRadius: 4 },
      label: { show: false }, labelLine: { show: false },
      data,
    }],
  });
  return c;
}
