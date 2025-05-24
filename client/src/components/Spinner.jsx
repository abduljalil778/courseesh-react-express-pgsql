export default function Spinner({ size = 48, className = '' }) {
  return (
    <img
      src="/Spinner.svg"
      alt="Loading..."
      width={size}
      height={size}
      className={className}
    />
  );
}