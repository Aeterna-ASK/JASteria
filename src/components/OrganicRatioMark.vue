<script setup>
/**
 * 有機食材の割合表示マーク（JAS 0004）
 * アマン壺の中に★を配置し、★の数で割合区分を表す。
 *   ★4 = 95%以上 / ★3 = 80%以上95%未満 / ★2 = 50%以上80%未満 / ★1 = 50%未満
 * ベクター(SVG)描画のため、どのサイズ・印刷でもくっきり表示できる。
 */
const props = defineProps({
  stars: { type: Number, default: 1 },   // 1〜4
  size: { type: Number, default: 28 },    // 表示幅(px)
  color: { type: String, default: '#b06a45' }, // 壺の色（テラコッタ）
  starColor: { type: String, default: '#ffffff' }
});

// 個数別の★配置（中心座標）と半径。本物寄りの胴体（肩が丸く下が細い）に合わせて配置。
const layouts = {
  1: { r: 13, pts: [[50, 60]] },
  2: { r: 12, pts: [[50, 47], [50, 75]] },
  3: { r: 10, pts: [[50, 42], [50, 62], [50, 82]] },
  4: { r: 9.5, pts: [[39, 50], [61, 50], [39, 76], [61, 76]] }
};

function layout() {
  const n = Math.min(4, Math.max(1, Math.round(props.stars)));
  return layouts[n];
}

// 5芒星のパスを生成（中心cx,cy・外半径r）
function starPath(cx, cy, r) {
  const inner = r * 0.42;
  let d = '';
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : inner;
    const x = cx + rad * Math.cos(ang);
    const y = cy + rad * Math.sin(ang);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  return d + 'Z';
}
</script>

<template>
  <svg
    :width="size"
    :height="size * 1.16"
    viewBox="0 0 100 116"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="有機割合表示マーク"
    style="display: inline-block; vertical-align: middle;"
  >
    <!-- 壺の口（外に開いたフチ）＋首 -->
    <path
      :fill="color"
      d="M37 4 Q50 0 63 4 Q66 5 64 8 Q57 11 57 15 L57 19 L43 19 L43 15 Q43 11 36 8 Q34 5 37 4 Z"
    />
    <!-- 壺の胴（肩が丸くふくらみ、底に向かって細くなる） -->
    <path
      :fill="color"
      d="M44 17 C 30 19 19 30 17 48 C 15 66 23 90 38 99 C 43 102 57 102 62 99 C 77 90 85 66 83 48 C 81 30 70 19 56 17 Z"
    />
    <!-- ★ -->
    <path
      v-for="(p, i) in layout().pts"
      :key="i"
      :d="starPath(p[0], p[1], layout().r)"
      :fill="starColor"
    />
  </svg>
</template>
