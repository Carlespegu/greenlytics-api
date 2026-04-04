export default function BackofficeFilterInput({
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
    />
  )
}
