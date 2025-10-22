export default function StatCard({ label, value, sub }) {
  return (
    <div className="card p-5 hover-elevate">
      <div className="text-sm text-subtle">{label}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      {sub && <div className="text-sm text-subtle mt-2">{sub}</div>}
    </div>
  )
}
