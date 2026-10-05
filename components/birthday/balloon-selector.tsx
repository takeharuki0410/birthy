"use client";
export function BalloonSelector({ value, onChange, remaining }: { value: number; onChange: (value: number) => void; remaining: number }) {
  const presets = [1,5,10,30,50,100];
  return <div className="balloon-selector"><h3>送る数を選択</h3><div className="balloon-presets">{presets.map((count) => <button type="button" key={count} className={value === count ? "selected" : ""} disabled={count > remaining} aria-pressed={value === count} onClick={() => onChange(count)}>{count}</button>)}</div><label className="balloon-custom"><span>カスタム</span><input aria-label="カスタム風船の個数" type="number" inputMode="numeric" min={1} max={Math.min(100,remaining)} value={Number.isNaN(value) ? "" : value} onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}/><span>個</span></label><div className="balloon-limit"><span>🔒</span><div><strong>あと{remaining}個送れます</strong><p>この誕生日年度につき、累計100個まで</p></div></div></div>;
}
