export default function Legend() {
  const Item = ({ color, label }) => (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-full" style={{ background: color }} />
      <span className="text-sm text-subtle">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-wrap gap-4">
      <Item color="#2f83ff" label="Conge annuel" />
      <Item color="#16a34a" label="Conge maladie" />
      <Item color="#f59e0b" label="Conge sans solde" />
      <Item color="#ec4899" label="Conge parental" />
      <Item color="#8b5cf6" label="Repos compensatoire" />
      <Item color="#64748b" label="Autre" />
      <Item color="rgba(14,165,233,0.15)" label="Jour ferie" />
      <Item color="#f1f5f9" label="Week-end" />
    </div>
  );
}
